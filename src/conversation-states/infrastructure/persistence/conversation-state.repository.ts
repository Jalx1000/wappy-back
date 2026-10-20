import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { ConversationState } from '../../domain/conversation-state';

export abstract class ConversationStateRepository {
  abstract create(
    data: Omit<ConversationState, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ConversationState>;

  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<ConversationState[]>;

  abstract findById(
    id: ConversationState['id'],
  ): Promise<NullableType<ConversationState>>;

  abstract findByIds(
    ids: ConversationState['id'][],
  ): Promise<ConversationState[]>;

  abstract update(
    id: ConversationState['id'],
    payload: DeepPartial<ConversationState>,
  ): Promise<ConversationState | null>;

  abstract remove(id: ConversationState['id']): Promise<void>;

  // One row per (conversation, channel) — the resolve key for status stamping.
  abstract findByConversation(
    conversationId: string,
    channel: string,
  ): Promise<NullableType<ConversationState>>;
}
