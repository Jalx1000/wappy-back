import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Invitation } from '../../domain/invitation';

export abstract class InvitationRepository {
  abstract create(
    data: Omit<Invitation, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Invitation>;

  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<Invitation[]>;

  abstract findById(id: Invitation['id']): Promise<NullableType<Invitation>>;

  abstract findByIds(ids: Invitation['id'][]): Promise<Invitation[]>;

  abstract findByToken(token: string): Promise<NullableType<Invitation>>;

  abstract findPendingByBrandId(brandId: number): Promise<Invitation[]>;

  abstract update(
    id: Invitation['id'],
    payload: DeepPartial<Invitation>,
  ): Promise<Invitation | null>;

  abstract remove(id: Invitation['id']): Promise<void>;
}
