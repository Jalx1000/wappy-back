import { InstagramConversation } from '../../../../domain/instagram-conversation';
import { InstagramConversationEntity } from '../entities/instagram-conversation.entity';

export class InstagramConversationMapper {
  static toDomain(raw: InstagramConversationEntity): InstagramConversation {
    const domainEntity = new InstagramConversation();
    domainEntity.contactId = raw.contactId;
    domainEntity.lastMessageAt = raw.lastMessageAt;
    domainEntity.igUserId = raw.igUserId;
    domainEntity.peerUsername = raw.peerUsername;
    domainEntity.connectionId = raw.connectionId;
    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    return domainEntity;
  }

  static toPersistence(
    domainEntity: InstagramConversation,
  ): InstagramConversationEntity {
    const persistenceEntity = new InstagramConversationEntity();
    persistenceEntity.contactId = domainEntity.contactId;
    persistenceEntity.lastMessageAt = domainEntity.lastMessageAt;
    persistenceEntity.igUserId = domainEntity.igUserId;
    persistenceEntity.peerUsername = domainEntity.peerUsername;
    persistenceEntity.connectionId = domainEntity.connectionId;
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    return persistenceEntity;
  }
}
