import { MessengerMessage } from '../../../../domain/messenger-message';
import { MessengerMessageEntity } from '../entities/messenger-message.entity';

export class MessengerMessageMapper {
  static toDomain(raw: MessengerMessageEntity): MessengerMessage {
    const domainEntity = new MessengerMessage();
    domainEntity.payload = raw.payload;
    domainEntity.sentAt = raw.sentAt;
    domainEntity.revokedAt = raw.revokedAt;
    domainEntity.editedFromId = raw.editedFromId;
    domainEntity.source = raw.source;
    domainEntity.status = raw.status;
    domainEntity.mediaUrl = raw.mediaUrl;
    domainEntity.mediaId = raw.mediaId;
    domainEntity.content = raw.content;
    domainEntity.messageType = raw.messageType;
    domainEntity.direction = raw.direction;
    domainEntity.externalId = raw.externalId;
    domainEntity.conversationId = raw.conversationId;
    domainEntity.connectionId = raw.connectionId;
    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    return domainEntity;
  }

  static toPersistence(domainEntity: MessengerMessage): MessengerMessageEntity {
    const persistenceEntity = new MessengerMessageEntity();
    persistenceEntity.payload = domainEntity.payload;
    persistenceEntity.sentAt = domainEntity.sentAt;
    persistenceEntity.revokedAt = domainEntity.revokedAt;
    persistenceEntity.editedFromId = domainEntity.editedFromId;
    persistenceEntity.source = domainEntity.source;
    persistenceEntity.status = domainEntity.status;
    persistenceEntity.mediaUrl = domainEntity.mediaUrl;
    persistenceEntity.mediaId = domainEntity.mediaId;
    persistenceEntity.content = domainEntity.content;
    persistenceEntity.messageType = domainEntity.messageType;
    persistenceEntity.direction = domainEntity.direction;
    persistenceEntity.externalId = domainEntity.externalId;
    persistenceEntity.conversationId = domainEntity.conversationId;
    persistenceEntity.connectionId = domainEntity.connectionId;
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    return persistenceEntity;
  }
}
