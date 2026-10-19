import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { ConversationRating } from '../../domain/conversation-rating';

export abstract class ConversationRatingRepository {
  abstract create(
    data: Omit<ConversationRating, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ConversationRating>;

  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<ConversationRating[]>;

  abstract findById(
    id: ConversationRating['id'],
  ): Promise<NullableType<ConversationRating>>;

  abstract findByIds(
    ids: ConversationRating['id'][],
  ): Promise<ConversationRating[]>;

  abstract update(
    id: ConversationRating['id'],
    payload: DeepPartial<ConversationRating>,
  ): Promise<ConversationRating | null>;

  abstract remove(id: ConversationRating['id']): Promise<void>;

  // Brand-scoped lookup for CSAT aggregation (optional created-at range).
  abstract findByBrand(
    brandId: number,
    range?: { from?: Date; to?: Date },
  ): Promise<ConversationRating[]>;
}
