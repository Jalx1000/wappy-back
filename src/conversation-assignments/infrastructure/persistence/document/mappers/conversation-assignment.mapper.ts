import { ConversationAssignment } from '../../../../domain/conversation-assignment';

import { ConversationAssignmentSchemaClass } from '../entities/conversation-assignment.schema';

export class ConversationAssignmentMapper {
  public static toDomain(
    raw: ConversationAssignmentSchemaClass,
  ): ConversationAssignment {
    const domainEntity = new ConversationAssignment();
    domainEntity.assignedTeamId = raw.assignedTeamId;

    domainEntity.assignedUserId = raw.assignedUserId;

    domainEntity.brandId = raw.brandId;

    domainEntity.channel = raw.channel;

    domainEntity.conversationId = raw.conversationId;

    domainEntity.id = raw._id.toString();
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  public static toPersistence(
    domainEntity: ConversationAssignment,
  ): ConversationAssignmentSchemaClass {
    const persistenceSchema = new ConversationAssignmentSchemaClass();
    persistenceSchema.assignedTeamId = domainEntity.assignedTeamId;

    persistenceSchema.assignedUserId = domainEntity.assignedUserId;

    persistenceSchema.brandId = domainEntity.brandId;

    persistenceSchema.channel = domainEntity.channel;

    persistenceSchema.conversationId = domainEntity.conversationId;

    if (domainEntity.id) {
      persistenceSchema._id = domainEntity.id;
    }
    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;

    return persistenceSchema;
  }
}
