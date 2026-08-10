import { NullableType } from '../../../utils/types/nullable.type';
import { MessengerMessage } from '../../domain/messenger-message';

export abstract class MessengerMessageRepository {
  abstract create(
    data: Omit<MessengerMessage, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<MessengerMessage>;

  // Idempotency lookup by Messenger message id (mid) within a connection.
  abstract findByConnectionAndExternalId(
    connectionId: number,
    externalId: string,
  ): Promise<NullableType<MessengerMessage>>;

  // Thread view: all messages of a conversation, oldest first.
  abstract findByConversationId(
    conversationId: string,
  ): Promise<MessengerMessage[]>;

  // Inbox list preview: the newest message of each given conversation.
  abstract findLatestByConversationIds(
    conversationIds: string[],
  ): Promise<MessengerMessage[]>;

  // Partial (not DeepPartial) so the jsonb `payload` field can be set wholesale.
  abstract update(
    id: MessengerMessage['id'],
    payload: Partial<MessengerMessage>,
  ): Promise<MessengerMessage | null>;
}
