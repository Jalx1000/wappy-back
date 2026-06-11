import { Injectable, NotFoundException } from '@nestjs/common';
import { CalendarItemsRepository } from './infrastructure/persistence/relational/repositories/calendar-items.repository';
import { CalendarItem } from './domain/calendar-item';
import { CreateCalendarItemDto } from './dto/create-calendar-item.dto';
import { UpdateCalendarItemDto } from './dto/update-calendar-item.dto';

@Injectable()
export class CalendarService {
  constructor(private readonly itemsRepo: CalendarItemsRepository) {}

  async getByBrandAndDateRange(
    brandId: number,
    from: Date,
    to: Date,
  ): Promise<CalendarItem[]> {
    return this.itemsRepo.findByBrandAndDateRange(brandId, from, to);
  }

  async getById(id: number, brandId: number): Promise<CalendarItem> {
    const item = await this.itemsRepo.findById(id);
    if (!item || item.brandId !== brandId) {
      throw new NotFoundException('Calendar item not found');
    }
    return item;
  }

  async create(brandId: number, dto: CreateCalendarItemDto): Promise<CalendarItem> {
    const item = new CalendarItem();
    item.brandId = brandId;
    item.title = dto.title;
    item.description = dto.description;
    item.scheduledAt = new Date(dto.scheduledAt);
    item.status = 'draft';
    item.type = dto.type;
    item.mediaUrls = dto.mediaUrls;
    item.metadata = dto.metadata;
    return this.itemsRepo.save(item);
  }

  async update(
    id: number,
    brandId: number,
    dto: UpdateCalendarItemDto,
  ): Promise<CalendarItem> {
    const item = await this.getById(id, brandId);
    if (dto.title) item.title = dto.title;
    if (dto.description !== undefined) item.description = dto.description;
    if (dto.scheduledAt) item.scheduledAt = new Date(dto.scheduledAt);
    if (dto.status) item.status = dto.status;
    if (dto.type !== undefined) item.type = dto.type;
    if (dto.mediaUrls) item.mediaUrls = dto.mediaUrls;
    if (dto.metadata) item.metadata = dto.metadata;
    return this.itemsRepo.save(item);
  }

  async delete(id: number, brandId: number): Promise<void> {
    const item = await this.getById(id, brandId);
    await this.itemsRepo.delete(item.id);
  }
}
