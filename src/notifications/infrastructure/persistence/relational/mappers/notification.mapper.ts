import { Injectable } from '@nestjs/common';
import { Notification } from '../../../../domain/notification';
import { NotificationEntity } from '../entities/notification.entity';

@Injectable()
export class NotificationMapper {
  toDomain(entity: NotificationEntity): Notification {
    const domain = new Notification();
    domain.id = entity.id;
    domain.userId = entity.userId;
    domain.brandId = entity.brandId;
    domain.type = entity.type;
    domain.title = entity.title;
    domain.body = entity.body;
    domain.read = entity.read;
    domain.metadata = entity.metadata;
    domain.createdAt = entity.createdAt;
    return domain;
  }

  toEntity(domain: Notification): NotificationEntity {
    const entity = new NotificationEntity();
    entity.id = domain.id;
    entity.userId = domain.userId;
    entity.brandId = domain.brandId;
    entity.type = domain.type;
    entity.title = domain.title;
    entity.body = domain.body;
    entity.read = domain.read;
    entity.metadata = domain.metadata;
    entity.createdAt = domain.createdAt;
    return entity;
  }
}
