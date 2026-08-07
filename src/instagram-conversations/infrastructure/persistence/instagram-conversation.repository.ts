import { NullableType } from '../../../utils/types/nullable.type';
import { InstagramConversation } from '../../domain/instagram-conversation';

export abstract class InstagramConversationRepository {
  abstract create(
    data: Omit<InstagramConversation, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<InstagramConversation>;

  abstract findById(
    id: InstagramConversation['id'],
  ): Promise<NullableType<InstagramConversation>>;

  // One thread per (connection, Instagram user) — the resolve key on ingestion.
  abstract findByConnectionAndUser(
    connectionId: number,
    igUserId: string,
  ): Promise<NullableType<InstagramConversation>>;

  // Inbox listing: all threads across a brand's connections, most recent first.
  abstract findByConnectionIds(
    connectionIds: number[],
  ): Promise<InstagramConversation[]>;

  abstract update(
    id: InstagramConversation['id'],
    payload: Partial<InstagramConversation>,
  ): Promise<InstagramConversation | null>;
}
