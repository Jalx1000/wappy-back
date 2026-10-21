import { Order } from '../../../../domain/order';

import { OrderEntity } from '../entities/order.entity';

export class OrderMapper {
  static toDomain(raw: OrderEntity): Order {
    const domainEntity = new Order();
    domainEntity.notes = raw.notes;

    domainEntity.currency = raw.currency;

    domainEntity.total = raw.total;

    domainEntity.status = raw.status;

    domainEntity.contactId = raw.contactId;

    domainEntity.brandId = raw.brandId;

    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Order): OrderEntity {
    const persistenceEntity = new OrderEntity();
    persistenceEntity.notes = domainEntity.notes;

    persistenceEntity.currency = domainEntity.currency;

    persistenceEntity.total = domainEntity.total;

    persistenceEntity.status = domainEntity.status;

    persistenceEntity.contactId = domainEntity.contactId;

    persistenceEntity.brandId = domainEntity.brandId;

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    return persistenceEntity;
  }
}
