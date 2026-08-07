import { WhatsappConversation } from '../../../../domain/whatsapp-conversation';

import { WhatsappConversationEntity } from '../entities/whatsapp-conversation.entity';

export class WhatsappConversationMapper {
  static toDomain(raw: WhatsappConversationEntity): WhatsappConversation {
    const domainEntity = new WhatsappConversation();
    domainEntity.contactId = raw.contactId;

    domainEntity.lastMessageAt = raw.lastMessageAt;

    domainEntity.waUserPhone = raw.waUserPhone;

    domainEntity.connectionId = raw.connectionId;

    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(
    domainEntity: WhatsappConversation,
  ): WhatsappConversationEntity {
    const persistenceEntity = new WhatsappConversationEntity();
    persistenceEntity.contactId = domainEntity.contactId;

    persistenceEntity.lastMessageAt = domainEntity.lastMessageAt;

    persistenceEntity.waUserPhone = domainEntity.waUserPhone;

    persistenceEntity.connectionId = domainEntity.connectionId;

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    return persistenceEntity;
  }
}
