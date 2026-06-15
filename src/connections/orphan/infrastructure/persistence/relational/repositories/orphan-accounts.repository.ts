import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrphanAccountEntity } from '../entities/orphan-account.entity';
import { OrphanAccount } from '../../../../domain/orphan-account';
import { OrphanAccountMapper } from '../mappers/orphan-account.mapper';
import { ChannelEnum } from '../../../../../domain/channel.enum';

@Injectable()
export class OrphanAccountsRepository {
  constructor(
    @InjectRepository(OrphanAccountEntity)
    private readonly repo: Repository<OrphanAccountEntity>,
    private readonly mapper: OrphanAccountMapper,
  ) {}

  async upsert(domain: OrphanAccount): Promise<OrphanAccount> {
    const entity = this.mapper.toEntity(domain);
    // UPSERT por (channel, accountId)
    await this.repo
      .createQueryBuilder()
      .insert()
      .into(OrphanAccountEntity)
      .values(entity as never)
      .orUpdate(
        [
          'account_handle',
          'access_token',
          'refresh_token',
          'expires_at',
          'scopes',
          'metadata',
          'discovered_by_user_id',
        ],
        ['channel', 'account_id'],
      )
      .execute();
    const saved = await this.repo.findOneOrFail({
      where: { channel: entity.channel, accountId: entity.accountId },
    });
    return this.mapper.toDomain(saved);
  }

  async findAll(): Promise<OrphanAccount[]> {
    const entities = await this.repo.find({ order: { discoveredAt: 'DESC' } });
    return entities.map((e) => this.mapper.toDomain(e));
  }

  async findById(id: number): Promise<OrphanAccount | null> {
    const e = await this.repo.findOne({ where: { id } });
    return e ? this.mapper.toDomain(e) : null;
  }

  async findByChannelAndAccountId(
    channel: ChannelEnum,
    accountId: string,
  ): Promise<OrphanAccount | null> {
    const e = await this.repo.findOne({ where: { channel, accountId } });
    return e ? this.mapper.toDomain(e) : null;
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  async count(): Promise<number> {
    return this.repo.count();
  }
}
