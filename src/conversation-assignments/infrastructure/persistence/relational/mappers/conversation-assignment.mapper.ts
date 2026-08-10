import { ConversationAssignment } from '../../../../domain/conversation-assignment';

import { ConversationAssignmentEntity } from '../entities/conversation-assignment.entity';

export class ConversationAssignmentMapper {
  static toDomain(raw: ConversationAssignmentEntity): ConversationAssignment {
    const domainEntity = new ConversationAssignment();
    domainEntity.assignedTeamId = raw.assignedTeamId;

    domainEntity.assignedUserId = raw.assignedUserId;

    domainEntity.brandId = raw.brandId;

    domainEntity.channel = raw.channel;

    domainEntity.conversationId = raw.conversationId;

    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(
    domainEntity: ConversationAssignment,
  ): ConversationAssignmentEntity {
    const persistenceEntity = new ConversationAssignmentEntity();
    persistenceEntity.assignedTeamId = domainEntity.assignedTeamId;

    persistenceEntity.assignedUserId = domainEntity.assignedUserId;

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
