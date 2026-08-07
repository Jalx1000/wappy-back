import { MessengerConversation } from '../../../../domain/messenger-conversation';
import { MessengerConversationEntity } from '../entities/messenger-conversation.entity';

export class MessengerConversationMapper {
  static toDomain(raw: MessengerConversationEntity): MessengerConversation {
    const domainEntity = new MessengerConversation();
    domainEntity.contactId = raw.contactId;
    domainEntity.lastMessageAt = raw.lastMessageAt;
    domainEntity.psid = raw.psid;
    domainEntity.peerName = raw.peerName;
    domainEntity.connectionId = raw.connectionId;
    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    return domainEntity;
  }

  static toPersistence(
    domainEntity: MessengerConversation,
  ): MessengerConversationEntity {
    const persistenceEntity = new MessengerConversationEntity();
    persistenceEntity.contactId = domainEntity.contactId;
    persistenceEntity.lastMessageAt = domainEntity.lastMessageAt;
    persistenceEntity.psid = domainEntity.psid;
    persistenceEntity.peerName = domainEntity.peerName;
    persistenceEntity.connectionId = domainEntity.connectionId;
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    return persistenceEntity;
  }
}
