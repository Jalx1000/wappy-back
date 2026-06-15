import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrphanAccountsRepository } from './infrastructure/persistence/relational/repositories/orphan-accounts.repository';
import { OrphanAccount } from './domain/orphan-account';
import { ConnectionsService } from '../connections.service';
import { EncryptionService } from '../../encryption/encryption.service';
import { OAuthAccountResult } from '../../oauth/oauth-provider.interface';

@Injectable()
export class OrphanAccountsService {
  private readonly logger = new Logger(OrphanAccountsService.name);

  constructor(
    private readonly repo: OrphanAccountsRepository,
    private readonly connectionsService: ConnectionsService,
    private readonly encryption: EncryptionService,
  ) {}

  async listAll() {
    const orphans = await this.repo.findAll();
    return orphans.map((o) => this.toPublicView(o));
  }

  private toPublicView(o: OrphanAccount) {
    return {
      id: o.id,
      channel: o.channel,
      accountId: o.accountId,
      accountHandle: o.accountHandle,
      scopes: o.scopes,
      metadata: o.metadata,
      discoveredByUserId: o.discoveredByUserId,
      discoveredAt: o.discoveredAt,
    };
  }

  async assignToBrand(id: number, brandId: number) {
    const orphan = await this.repo.findById(id);
    if (!orphan) throw new NotFoundException(`Orphan #${id} not found`);

    const accessToken = this.safeDecrypt(orphan.accessToken);
    const refreshToken = orphan.refreshToken
      ? this.safeDecrypt(orphan.refreshToken)
      : undefined;

    const oauthResult: OAuthAccountResult = {
      channel: orphan.channel,
      accountId: orphan.accountId,
      accountHandle: orphan.accountHandle,
      accessToken,
      refreshToken,
      expiresAt: orphan.expiresAt ?? undefined,
      scopes: orphan.scopes,
      metadata: orphan.metadata,
    };

    const connection = await this.connectionsService.upsertFromOAuth(
      brandId,
      oauthResult,
    );

    await this.repo.delete(id);
    this.logger.log(
      `orphan ${id} (${orphan.channel}/${orphan.accountId}) → connection ${connection.id} brand ${brandId}`,
    );
    return connection;
  }

  async discard(id: number): Promise<void> {
    const orphan = await this.repo.findById(id);
    if (!orphan) throw new NotFoundException(`Orphan #${id} not found`);
    await this.repo.delete(id);
    this.logger.log(`orphan ${id} discarded`);
  }

  private safeDecrypt(value: string): string {
    try {
      return this.encryption.decrypt(value);
    } catch {
      throw new ForbiddenException('Failed to decrypt stored token');
    }
  }
}
