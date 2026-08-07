import { WhatsappSyncRequest } from '../../../../domain/whatsapp-sync-request';

import { WhatsappSyncRequestEntity } from '../entities/whatsapp-sync-request.entity';

export class WhatsappSyncRequestMapper {
  static toDomain(raw: WhatsappSyncRequestEntity): WhatsappSyncRequest {
    const domainEntity = new WhatsappSyncRequest();
    domainEntity.progress = raw.progress;

    domainEntity.phase = raw.phase;

    domainEntity.status = raw.status;

    domainEntity.syncType = raw.syncType;

    domainEntity.requestId = raw.requestId;

    domainEntity.connectionId = raw.connectionId;

    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(
    domainEntity: WhatsappSyncRequest,
  ): WhatsappSyncRequestEntity {
    const persistenceEntity = new WhatsappSyncRequestEntity();
    persistenceEntity.progress = domainEntity.progress;

    persistenceEntity.phase = domainEntity.phase;

    persistenceEntity.status = domainEntity.status;

    persistenceEntity.syncType = domainEntity.syncType;

    persistenceEntity.requestId = domainEntity.requestId;

    persistenceEntity.connectionId = domainEntity.connectionId;

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    return persistenceEntity;
  }
}
