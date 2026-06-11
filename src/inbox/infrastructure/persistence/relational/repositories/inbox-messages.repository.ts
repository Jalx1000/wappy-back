import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InboxMessageEntity } from '../entities/inbox-message.entity';
import { InboxMessage } from '../../../../domain/inbox-message';
import { InboxMessageMapper } from '../mappers/inbox-message.mapper';

@Injectable()
export class InboxMessagesRepository {
  constructor(
    @InjectRepository(InboxMessageEntity)
    private readonly repo: Repository<InboxMessageEntity>,
    private readonly mapper: InboxMessageMapper,
  ) {}

  async findByBrand(
    brandId: number,
    status?: string,
    channel?: string,
    type?: string,
    limit: number = 20,
  ): Promise<InboxMessage[]> {
    const query = this.repo.createQueryBuilder('m')
      .where('m.brandId = :brandId', { brandId });

    if (status) query.andWhere('m.status = :status', { status });
    if (channel) query.andWhere('m.channel = :channel', { channel });
    if (type) query.andWhere('m.type = :type', { type });

    const entities = await query
      .orderBy('m.createdAt', 'DESC')
      .take(limit)
      .getMany();

    return entities.map((e) => this.mapper.toDomain(e));
  }

  async findByExternalId(externalId: string): Promise<InboxMessage | null> {
    const entity = await this.repo.findOne({ where: { externalId } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async save(domain: InboxMessage): Promise<InboxMessage> {
    const entity = this.mapper.toEntity(domain);
    const saved = await this.repo.save(entity);
    return this.mapper.toDomain(saved);
  }

  async updateStatus(id: number, status: string): Promise<void> {
    await this.repo.update(id, { status });
  }
}
