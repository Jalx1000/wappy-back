import { ConversationRating } from '../../../../domain/conversation-rating';

import { ConversationRatingEntity } from '../entities/conversation-rating.entity';

export class ConversationRatingMapper {
  static toDomain(raw: ConversationRatingEntity): ConversationRating {
    const domainEntity = new ConversationRating();
    domainEntity.comment = raw.comment;

    domainEntity.brandId = raw.brandId;

    domainEntity.conversationId = raw.conversationId;

    domainEntity.channel = raw.channel;

    domainEntity.score = raw.score;

    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(
    domainEntity: ConversationRating,
  ): ConversationRatingEntity {
    const persistenceEntity = new ConversationRatingEntity();
    persistenceEntity.comment = domainEntity.comment;

    persistenceEntity.brandId = domainEntity.brandId;

    persistenceEntity.conversationId = domainEntity.conversationId;

    persistenceEntity.channel = domainEntity.channel;

    persistenceEntity.score = domainEntity.score;

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    return persistenceEntity;
  }
}
