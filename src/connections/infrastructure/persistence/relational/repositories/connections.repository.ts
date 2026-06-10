import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
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
    const entity = await this.repo.findOne({ where: { brandId, channel, accountId } });
    return entity ? ConnectionMapper.toDomain(entity) : null;
  }

  async findExpiring(before: Date): Promise<Connection[]> {
    const entities = await this.repo.find({
      where: {
        expiresAt: LessThan(before),
        status: ConnectionStatusEnum.connected,
      },
    });
    return entities.map(ConnectionMapper.toDomain);
  }

  async softDelete(id: number): Promise<void> {
    await this.repo.softDelete(id);
  }
}
