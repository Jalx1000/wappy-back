import { Injectable } from '@nestjs/common';
import { CalendarItem } from '../../../../domain/calendar-item';
import { CalendarItemEntity } from '../entities/calendar-item.entity';

@Injectable()
export class CalendarItemMapper {
  toDomain(entity: CalendarItemEntity): CalendarItem {
    const domain = new CalendarItem();
    domain.id = entity.id;
    domain.brandId = entity.brandId;
    domain.connectionId = entity.connectionId;
    domain.title = entity.title;
    domain.description = entity.description;
    domain.scheduledAt = entity.scheduledAt;
    domain.status = entity.status;
    domain.type = entity.type;
    domain.mediaUrls = entity.mediaUrls;
    domain.metadata = entity.metadata;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;
    return domain;
  }

  toEntity(domain: CalendarItem): CalendarItemEntity {
    const entity = new CalendarItemEntity();
    entity.id = domain.id;
    entity.brandId = domain.brandId;
    entity.connectionId = domain.connectionId;
    entity.title = domain.title;
    entity.description = domain.description;
    entity.scheduledAt = domain.scheduledAt;
    entity.status = domain.status;
    entity.type = domain.type;
    entity.mediaUrls = domain.mediaUrls;
    entity.metadata = domain.metadata;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    entity.deletedAt = domain.deletedAt;
    return entity;
  }
}
