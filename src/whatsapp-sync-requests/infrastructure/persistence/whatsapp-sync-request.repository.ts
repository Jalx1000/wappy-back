import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { WhatsappSyncRequest } from '../../domain/whatsapp-sync-request';

export abstract class WhatsappSyncRequestRepository {
  abstract create(
    data: Omit<WhatsappSyncRequest, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<WhatsappSyncRequest>;

  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<WhatsappSyncRequest[]>;

  abstract findById(
    id: WhatsappSyncRequest['id'],
  ): Promise<NullableType<WhatsappSyncRequest>>;

  abstract findByIds(
    ids: WhatsappSyncRequest['id'][],
  ): Promise<WhatsappSyncRequest[]>;

  abstract update(
    id: WhatsappSyncRequest['id'],
    payload: DeepPartial<WhatsappSyncRequest>,
  ): Promise<WhatsappSyncRequest | null>;

  abstract remove(id: WhatsappSyncRequest['id']): Promise<void>;
}
