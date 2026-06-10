import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Connection } from './domain/connection';
import { ConnectionsRepository } from './infrastructure/persistence/relational/repositories/connections.repository';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import { EncryptionService } from '../encryption/encryption.service';
import { NullableType } from '../utils/types/nullable.type';
import { ConnectionStatusEnum } from './domain/connection-status.enum';
import { QUEUE_SYNC_SOCIAL } from '../queues/queue-names.constants';
import { OAuthAccountResult } from '../oauth/oauth-provider.interface';

@Injectable()
export class ConnectionsService {
  constructor(
    private readonly connectionsRepo: ConnectionsRepository,
    private readonly encryptionService: EncryptionService,
    @InjectQueue(QUEUE_SYNC_SOCIAL) private readonly syncSocialQueue: Queue,
  ) {}

  async create(brandId: number, dto: CreateConnectionDto): Promise<Connection> {
    const connection = new Connection();
    connection.brandId = brandId;
    connection.channel = dto.channel;
    connection.accountHandle = dto.accountHandle;
    connection.accountId = dto.accountId;
    connection.accessToken = this.encryptionService.encrypt(dto.accessToken);
    connection.refreshToken = dto.refreshToken
      ? this.encryptionService.encrypt(dto.refreshToken)
      : null;
    connection.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    connection.status = ConnectionStatusEnum.connected;
    connection.lastSyncAt = null;
    connection.scopes = dto.scopes ?? [];
    connection.metadata = dto.metadata ?? {};

    return this.connectionsRepo.create(connection);
  }

  async findAllForBrand(brandId: number): Promise<Connection[]> {
    return this.connectionsRepo.findByBrandId(brandId);
  }

  async findOne(brandId: number, id: number): Promise<Connection> {
    const connection = await this.connectionsRepo.findByBrandIdAndId(
      brandId,
      id,
    );
    if (!connection) throw new NotFoundException(`Connection #${id} not found`);
    return connection;
  }

  async findById(id: number): Promise<NullableType<Connection>> {
    return this.connectionsRepo.findById(id);
  }

  async update(
    brandId: number,
    id: number,
    dto: UpdateConnectionDto,
  ): Promise<Connection> {
    await this.findOne(brandId, id);
    const patch: Partial<Connection> = { ...dto } as Partial<Connection>;
    if (dto.accessToken) {
      patch.accessToken = this.encryptionService.encrypt(dto.accessToken);
    }
    if (dto.refreshToken) {
      patch.refreshToken = this.encryptionService.encrypt(dto.refreshToken);
    }
    return this.connectionsRepo.update(id, patch);
  }

  async remove(brandId: number, id: number): Promise<void> {
    await this.findOne(brandId, id);
    await this.connectionsRepo.softDelete(id);
  }

  async upsertFromOAuth(
    brandId: number,
    data: OAuthAccountResult,
  ): Promise<Connection> {
    const encryptedAccess = this.encryptionService.encrypt(data.accessToken);
    const encryptedRefresh = data.refreshToken
      ? this.encryptionService.encrypt(data.refreshToken)
      : null;

    const existing = await this.connectionsRepo.findByBrandChannelAccount(
      brandId,
      data.channel,
      data.accountId,
    );

    if (existing) {
      return this.connectionsRepo.update(existing.id, {
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh ?? existing.refreshToken,
        expiresAt: data.expiresAt ?? existing.expiresAt,
        accountHandle: data.accountHandle,
        status: ConnectionStatusEnum.connected,
        scopes: data.scopes,
        metadata: data.metadata,
      });
    }

    const connection = new Connection();
    connection.brandId = brandId;
    connection.channel = data.channel;
    connection.accountId = data.accountId;
    connection.accountHandle = data.accountHandle;
    connection.accessToken = encryptedAccess;
    connection.refreshToken = encryptedRefresh;
    connection.expiresAt = data.expiresAt ?? null;
    connection.status = ConnectionStatusEnum.connected;
    connection.lastSyncAt = null;
    connection.scopes = data.scopes;
    connection.metadata = data.metadata;

    return this.connectionsRepo.create(connection);
  }

  async findExpiring(before: Date): Promise<Connection[]> {
    return this.connectionsRepo.findExpiring(before);
  }

  async enqueueSync(
    brandId: number,
    id: number,
  ): Promise<{ jobId: string | undefined }> {
    const connection = await this.findOne(brandId, id);
    if (connection.status === ConnectionStatusEnum.error) {
      // allow re-sync even on error state
    }
    const job = await this.syncSocialQueue.add(
      'sync-connection',
      { brandId, connectionId: id },
      { jobId: `sync-${id}-${Date.now()}` },
    );
    return { jobId: job.id };
  }
}
