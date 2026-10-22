import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { ApiKey } from '../../domain/api-key';

export abstract class ApiKeyRepository {
  abstract create(
    data: Omit<ApiKey, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ApiKey>;

  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<ApiKey[]>;

  abstract findById(id: ApiKey['id']): Promise<NullableType<ApiKey>>;

  abstract findByIds(ids: ApiKey['id'][]): Promise<ApiKey[]>;

  // Lookup by the stored SHA-256 hash — the auth path for the public API.
  abstract findByHash(keyHash: string): Promise<NullableType<ApiKey>>;

  // All keys of a brand — for the admin panel listing.
  abstract findByBrand(brandId: number): Promise<ApiKey[]>;

  abstract update(
    id: ApiKey['id'],
    payload: DeepPartial<ApiKey>,
  ): Promise<ApiKey | null>;

  abstract remove(id: ApiKey['id']): Promise<void>;
}
