import { ApiKey } from '../../../../domain/api-key';

import { ApiKeyEntity } from '../entities/api-key.entity';

export class ApiKeyMapper {
  static toDomain(raw: ApiKeyEntity): ApiKey {
    const domainEntity = new ApiKey();
    domainEntity.revokedAt = raw.revokedAt;

    domainEntity.lastUsedAt = raw.lastUsedAt;

    domainEntity.label = raw.label;

    domainEntity.environment = raw.environment;

    domainEntity.keyPrefix = raw.keyPrefix;

    domainEntity.keyHash = raw.keyHash;

    domainEntity.brandId = raw.brandId;

    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: ApiKey): ApiKeyEntity {
    const persistenceEntity = new ApiKeyEntity();
    persistenceEntity.revokedAt = domainEntity.revokedAt;

    persistenceEntity.lastUsedAt = domainEntity.lastUsedAt;

    persistenceEntity.label = domainEntity.label;

    persistenceEntity.environment = domainEntity.environment;

    persistenceEntity.keyPrefix = domainEntity.keyPrefix;

    persistenceEntity.keyHash = domainEntity.keyHash;

    persistenceEntity.brandId = domainEntity.brandId;

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    return persistenceEntity;
  }
}
