export class CreateConversationAssignmentDto {
  assignedTeamId?: string | null;

  assignedUserId?: number | null;

  brandId?: number;

  channel?: string;

  conversationId?: string;

  // Don't forget to use the class-validator decorators in the DTO properties.
}
