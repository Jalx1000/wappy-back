import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { WhatsappConversation } from '../../domain/whatsapp-conversation';

export abstract class WhatsappConversationRepository {
  abstract create(
    data: Omit<WhatsappConversation, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<WhatsappConversation>;

  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<WhatsappConversation[]>;

  abstract findById(
    id: WhatsappConversation['id'],
  ): Promise<NullableType<WhatsappConversation>>;

  abstract findByIds(
    ids: WhatsappConversation['id'][],
  ): Promise<WhatsappConversation[]>;

  // One thread per (connection, WhatsApp user) — the resolve key on ingestion.
  abstract findByConnectionAndUser(
    connectionId: number,
    waUserPhone: string,
  ): Promise<NullableType<WhatsappConversation>>;

  // Inbox listing: all threads across a brand's connections, most recent first.
  abstract findByConnectionIds(
    connectionIds: number[],
  ): Promise<WhatsappConversation[]>;

  abstract update(
    id: WhatsappConversation['id'],
    payload: DeepPartial<WhatsappConversation>,
  ): Promise<WhatsappConversation | null>;

  abstract remove(id: WhatsappConversation['id']): Promise<void>;
}
