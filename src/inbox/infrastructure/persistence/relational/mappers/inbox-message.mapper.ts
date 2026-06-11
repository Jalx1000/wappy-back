import { Injectable } from '@nestjs/common';
import { InboxMessage } from '../../../../domain/inbox-message';
import { InboxMessageEntity } from '../entities/inbox-message.entity';

@Injectable()
export class InboxMessageMapper {
  toDomain(entity: InboxMessageEntity): InboxMessage {
    const domain = new InboxMessage();
    domain.id = entity.id;
    domain.brandId = entity.brandId;
    domain.connectionId = entity.connectionId;
    domain.channel = entity.channel;
    domain.externalId = entity.externalId;
    domain.type = entity.type;
    domain.fromHandle = entity.fromHandle;
    domain.fromName = entity.fromName;
    domain.content = entity.content;
    domain.mediaUrl = entity.mediaUrl;
    domain.parentExternalId = entity.parentExternalId;
    domain.status = entity.status;
    domain.publishedAt = entity.publishedAt;
    domain.createdAt = entity.createdAt;
    return domain;
  }

  toEntity(domain: InboxMessage): InboxMessageEntity {
    const entity = new InboxMessageEntity();
    entity.id = domain.id;
    entity.brandId = domain.brandId;
    entity.connectionId = domain.connectionId;
    entity.channel = domain.channel;
    entity.externalId = domain.externalId;
    entity.type = domain.type;
    entity.fromHandle = domain.fromHandle;
    entity.fromName = domain.fromName;
    entity.content = domain.content;
    entity.mediaUrl = domain.mediaUrl;
    entity.parentExternalId = domain.parentExternalId;
    entity.status = domain.status;
    entity.publishedAt = domain.publishedAt;
    entity.createdAt = domain.createdAt;
    return entity;
  }
}
