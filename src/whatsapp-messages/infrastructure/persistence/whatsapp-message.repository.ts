import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { WhatsappMessage } from '../../domain/whatsapp-message';

export abstract class WhatsappMessageRepository {
  abstract create(
    data: Omit<WhatsappMessage, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<WhatsappMessage>;

  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<WhatsappMessage[]>;

  abstract findById(
    id: WhatsappMessage['id'],
  ): Promise<NullableType<WhatsappMessage>>;

  abstract findByIds(ids: WhatsappMessage['id'][]): Promise<WhatsappMessage[]>;

  // Idempotency lookup by WhatsApp message id (wamid) within a connection.
  abstract findByConnectionAndExternalId(
    connectionId: number,
    externalId: string,
  ): Promise<NullableType<WhatsappMessage>>;

  // Thread view: all messages of a conversation, oldest first.
  abstract findByConversationId(
    conversationId: string,
  ): Promise<WhatsappMessage[]>;

  abstract findLatestByConversationIds(
    conversationIds: string[],
  ): Promise<WhatsappMessage[]>;

  // Partial (not DeepPartial) so the jsonb `payload` field (Record) can be set
  // wholesale without DeepPartial recursing into its unknown values.
  abstract update(
    id: WhatsappMessage['id'],
    payload: Partial<WhatsappMessage>,
  ): Promise<WhatsappMessage | null>;

  abstract remove(id: WhatsappMessage['id']): Promise<void>;
}
