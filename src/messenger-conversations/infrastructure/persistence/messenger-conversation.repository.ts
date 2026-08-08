import { NullableType } from '../../../utils/types/nullable.type';
import { MessengerConversation } from '../../domain/messenger-conversation';

export abstract class MessengerConversationRepository {
  abstract create(
    data: Omit<MessengerConversation, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<MessengerConversation>;

  abstract findById(
    id: MessengerConversation['id'],
  ): Promise<NullableType<MessengerConversation>>;

  // One thread per (connection, PSID) — the resolve key on ingestion.
  abstract findByConnectionAndUser(
    connectionId: number,
    psid: string,
  ): Promise<NullableType<MessengerConversation>>;

  // Inbox listing: all threads across a brand's connections, most recent first.
  abstract findByConnectionIds(
    connectionIds: number[],
  ): Promise<MessengerConversation[]>;

  // Backfill: threads whose peer name was never resolved (only the id is known).
  abstract findMissingProfile(): Promise<MessengerConversation[]>;

  abstract update(
    id: MessengerConversation['id'],
    payload: Partial<MessengerConversation>,
  ): Promise<MessengerConversation | null>;
}
