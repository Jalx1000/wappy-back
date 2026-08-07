import { WhatsappMessage } from '../../../../domain/whatsapp-message';

import { WhatsappMessageEntity } from '../entities/whatsapp-message.entity';

export class WhatsappMessageMapper {
  static toDomain(raw: WhatsappMessageEntity): WhatsappMessage {
    const domainEntity = new WhatsappMessage();
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

  static toPersistence(domainEntity: WhatsappMessage): WhatsappMessageEntity {
    const persistenceEntity = new WhatsappMessageEntity();
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
