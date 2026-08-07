import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { Connection } from '../../../../domain/connection';
import { ConnectionEntity } from '../entities/connection.entity';
import { ConnectionMapper } from '../mappers/connection.mapper';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { ConnectionStatusEnum } from '../../../../domain/connection-status.enum';
import { ChannelEnum } from '../../../../domain/channel.enum';

@Injectable()
export class ConnectionsRepository {
  constructor(
    @InjectRepository(ConnectionEntity)
    private readonly repo: Repository<ConnectionEntity>,
  ) {}

  async create(data: Connection): Promise<Connection> {
    const entity = await this.repo.save(
      this.repo.create(ConnectionMapper.toPersistence(data)),
    );
    return ConnectionMapper.toDomain(entity);
  }

  async findById(id: number): Promise<NullableType<Connection>> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? ConnectionMapper.toDomain(entity) : null;
  }

  async findByBrandId(brandId: number): Promise<Connection[]> {
    const entities = await this.repo.find({ where: { brandId } });
    return entities.map(ConnectionMapper.toDomain);
  }

  async findByBrandIdAndId(
    brandId: number,
    id: number,
  ): Promise<NullableType<Connection>> {
    const entity = await this.repo.findOne({ where: { brandId, id } });
    return entity ? ConnectionMapper.toDomain(entity) : null;
  }

  async update(id: number, data: Partial<Connection>): Promise<Connection> {
    await this.repo.update(id, data as any);
    const entity = await this.repo.findOneOrFail({ where: { id } });
    return ConnectionMapper.toDomain(entity);
  }

  async updateStatus(
    id: number,
    status: ConnectionStatusEnum,
    lastSyncAt?: Date,
  ): Promise<void> {
    const patch: any = { status };
    if (lastSyncAt) patch.lastSyncAt = lastSyncAt;
    await this.repo.update(id, patch);
  }

  async findByBrandChannelAccount(
    brandId: number,
    channel: ChannelEnum,
    accountId: string,
  ): Promise<NullableType<Connection>> {
    const entity = await this.repo.findOne({
      where: { brandId, channel, accountId },
    });
    return entity ? ConnectionMapper.toDomain(entity) : null;
  }

  async findByChannelAndAccount(
    channel: ChannelEnum,
    accountId: string,
  ): Promise<Connection[]> {
    const entities = await this.repo.find({ where: { channel, accountId } });
    return entities.map(ConnectionMapper.toDomain);
  }

  async findExpiring(before: Date): Promise<Connection[]> {
    // Include already-expired connections, not just connected ones. A single
    // transient refresh failure flips status to `expired`; if we only retried
    // `connected` ones it would be stuck there forever and force a manual
    // re-auth. Retrying lets short-lived tokens (e.g. TikTok, 24h) self-heal
    // as long as the refresh token is still valid.
    const entities = await this.repo.find({
      where: {
        expiresAt: LessThan(before),
        status: In([
          ConnectionStatusEnum.connected,
          ConnectionStatusEnum.expired,
        ]),
      },
    });
    return entities.map(ConnectionMapper.toDomain);
  }

  async findConnectedByChannel(channel: ChannelEnum): Promise<Connection[]> {
    // Excluye conexiones de marcas soft-deleted: los fanouts diarios seguían
    // sincronizando cuentas de marcas eliminadas, escribiendo métricas que
    // ninguna pantalla puede ver.
    const entities = await this.repo
      .createQueryBuilder('c')
      .innerJoin('brand', 'b', 'b.id = c."brandId" AND b."deletedAt" IS NULL')
      .where('c.channel = :channel', { channel })
      .andWhere('c.status = :status', {
        status: ConnectionStatusEnum.connected,
      })
      .andWhere('c."deletedAt" IS NULL')
      .getMany();
    return entities.map(ConnectionMapper.toDomain);
  }

  async softDelete(id: number): Promise<void> {
    await this.repo.softDelete(id);
  }
}
