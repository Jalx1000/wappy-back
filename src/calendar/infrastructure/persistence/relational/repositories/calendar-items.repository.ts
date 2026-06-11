import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
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

  async save(domain: CalendarItem): Promise<CalendarItem> {
    const entity = this.mapper.toEntity(domain);
    const saved = await this.repo.save(entity);
    return this.mapper.toDomain(saved);
  }

  async delete(id: number): Promise<void> {
    await this.repo.softDelete(id);
  }
}
