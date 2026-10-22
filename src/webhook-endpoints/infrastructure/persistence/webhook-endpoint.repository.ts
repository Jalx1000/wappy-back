import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { WebhookEndpoint } from '../../domain/webhook-endpoint';

export abstract class WebhookEndpointRepository {
  abstract create(
    data: Omit<WebhookEndpoint, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<WebhookEndpoint>;

  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<WebhookEndpoint[]>;

  abstract findById(
    id: WebhookEndpoint['id'],
  ): Promise<NullableType<WebhookEndpoint>>;

  abstract findByIds(ids: WebhookEndpoint['id'][]): Promise<WebhookEndpoint[]>;

  // Active endpoints of a brand — the delivery targets for outbound events.
  abstract findActiveByBrand(brandId: number): Promise<WebhookEndpoint[]>;

  abstract update(
    id: WebhookEndpoint['id'],
    payload: DeepPartial<WebhookEndpoint>,
  ): Promise<WebhookEndpoint | null>;

  abstract remove(id: WebhookEndpoint['id']): Promise<void>;
}
