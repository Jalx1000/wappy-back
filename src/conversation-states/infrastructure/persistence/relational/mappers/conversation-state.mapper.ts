import { ConversationState } from '../../../../domain/conversation-state';

import { ConversationStateEntity } from '../entities/conversation-state.entity';

export class ConversationStateMapper {
  static toDomain(raw: ConversationStateEntity): ConversationState {
    const domainEntity = new ConversationState();
    domainEntity.resolvedByUserId = raw.resolvedByUserId;

    domainEntity.resolvedAt = raw.resolvedAt;

    domainEntity.firstResponseAt = raw.firstResponseAt;

    domainEntity.firstInboundAt = raw.firstInboundAt;

    domainEntity.status = raw.status;

    domainEntity.brandId = raw.brandId;

    domainEntity.channel = raw.channel;

    domainEntity.conversationId = raw.conversationId;

    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(
    domainEntity: ConversationState,
  ): ConversationStateEntity {
    const persistenceEntity = new ConversationStateEntity();
    persistenceEntity.resolvedByUserId = domainEntity.resolvedByUserId;

    persistenceEntity.resolvedAt = domainEntity.resolvedAt;

    persistenceEntity.firstResponseAt = domainEntity.firstResponseAt;

    persistenceEntity.firstInboundAt = domainEntity.firstInboundAt;

    persistenceEntity.status = domainEntity.status;

    persistenceEntity.brandId = domainEntity.brandId;

    persistenceEntity.channel = domainEntity.channel;

    persistenceEntity.conversationId = domainEntity.conversationId;

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    return persistenceEntity;
  }
}
