import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull, LessThanOrEqual } from 'typeorm';
import { CalendarItemEntity } from '../entities/calendar-item.entity';
import { CalendarItem } from '../../../../domain/calendar-item';
import { CalendarItemMapper } from '../mappers/calendar-item.mapper';

@Injectable()
export class CalendarItemsRepository {
  constructor(
    @InjectRepository(CalendarItemEntity)
    private readonly repo: Repository<CalendarItemEntity>,
    private readonly mapper: CalendarItemMapper,
  ) {}

  async findByBrandAndDateRange(
    brandId: number,
    from: Date,
    to: Date,
  ): Promise<CalendarItem[]> {
    const entities = await this.repo.find({
      where: {
        brandId,
        scheduledAt: Between(from, to),
        deletedAt: IsNull(),
      },
      order: { scheduledAt: 'ASC' },
    });
    return entities.map((e) => this.mapper.toDomain(e));
  }

  async findById(id: number): Promise<CalendarItem | null> {
    const entity = await this.repo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findDueScheduled(now: Date, limit = 50): Promise<CalendarItem[]> {
    const entities = await this.repo.find({
      where: {
        status: 'scheduled',
        scheduledAt: LessThanOrEqual(now),
        deletedAt: IsNull(),
      },
      order: { scheduledAt: 'ASC' },
      take: limit,
    });
    return entities.map((e) => this.mapper.toDomain(e));
  }

  // Atomically transition scheduled -> publishing so two overlapping scans
  // can't publish the same item twice. Returns true only for the winner.
  async claimForPublishing(id: number): Promise<boolean> {
    const res = await this.repo.update(
      { id, status: 'scheduled' },
      { status: 'publishing' },
    );
    return (res.affected ?? 0) > 0;
  }

  async updateStatus(id: number, status: string): Promise<void> {
    await this.repo.update(id, { status });
  }

  async save(domain: CalendarItem): Promise<CalendarItem> {
    const entity = this.mapper.toEntity(domain);
    const saved = await this.repo.save(entity);
    return this.mapper.toDomain(saved);
  }

  async delete(id: number): Promise<void> {
    await this.repo.softDelete(id);
  }
}
