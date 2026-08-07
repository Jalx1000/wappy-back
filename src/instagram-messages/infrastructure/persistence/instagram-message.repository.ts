import { NullableType } from '../../../utils/types/nullable.type';
import { InstagramMessage } from '../../domain/instagram-message';

export abstract class InstagramMessageRepository {
  abstract create(
    data: Omit<InstagramMessage, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<InstagramMessage>;

  // Idempotency lookup by Instagram message id (mid) within a connection.
  abstract findByConnectionAndExternalId(
    connectionId: number,
    externalId: string,
  ): Promise<NullableType<InstagramMessage>>;

  // Thread view: all messages of a conversation, oldest first.
  abstract findByConversationId(
    conversationId: string,
  ): Promise<InstagramMessage[]>;

  // Partial (not DeepPartial) so the jsonb `payload` field can be set wholesale.
  abstract update(
    id: InstagramMessage['id'],
    payload: Partial<InstagramMessage>,
  ): Promise<InstagramMessage | null>;
}
