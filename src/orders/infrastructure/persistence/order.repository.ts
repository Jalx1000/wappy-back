import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Order } from '../../domain/order';

export abstract class OrderRepository {
  abstract create(
    data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Order>;

  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<Order[]>;

  abstract findById(id: Order['id']): Promise<NullableType<Order>>;

  abstract findByIds(ids: Order['id'][]): Promise<Order[]>;

  abstract update(
    id: Order['id'],
    payload: DeepPartial<Order>,
  ): Promise<Order | null>;

  abstract remove(id: Order['id']): Promise<void>;
}
