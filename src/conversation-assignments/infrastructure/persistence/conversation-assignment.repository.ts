import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { ConversationAssignment } from '../../domain/conversation-assignment';

export interface AssignmentInput {
  conversationId: string;
  channel: string;
  brandId: number;
  assignedUserId: number | null;
  assignedTeamId: string | null;
}

export abstract class ConversationAssignmentRepository {
  // One assignment row per conversation (keyed by conversationId).
  abstract findByConversationId(
    conversationId: string,
  ): Promise<NullableType<ConversationAssignment>>;

  abstract findByConversationIds(
    conversationIds: string[],
  ): Promise<ConversationAssignment[]>;

  abstract upsert(input: AssignmentInput): Promise<ConversationAssignment>;

  abstract create(
    data: Omit<ConversationAssignment, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ConversationAssignment>;

  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<ConversationAssignment[]>;

  abstract findById(
    id: ConversationAssignment['id'],
  ): Promise<NullableType<ConversationAssignment>>;

  abstract findByIds(
    ids: ConversationAssignment['id'][],
  ): Promise<ConversationAssignment[]>;

  abstract update(
    id: ConversationAssignment['id'],
    payload: DeepPartial<ConversationAssignment>,
  ): Promise<ConversationAssignment | null>;

  abstract remove(id: ConversationAssignment['id']): Promise<void>;
}
