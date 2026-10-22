import { WebhookEndpoint } from '../../../../domain/webhook-endpoint';

import { WebhookEndpointEntity } from '../entities/webhook-endpoint.entity';

export class WebhookEndpointMapper {
  static toDomain(raw: WebhookEndpointEntity): WebhookEndpoint {
    const domainEntity = new WebhookEndpoint();
    domainEntity.active = raw.active;

    domainEntity.secret = raw.secret;

    domainEntity.url = raw.url;

    domainEntity.brandId = raw.brandId;

    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: WebhookEndpoint): WebhookEndpointEntity {
    const persistenceEntity = new WebhookEndpointEntity();
    persistenceEntity.active = domainEntity.active;

    persistenceEntity.secret = domainEntity.secret;

    persistenceEntity.url = domainEntity.url;

    persistenceEntity.brandId = domainEntity.brandId;

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    return persistenceEntity;
  }
}
