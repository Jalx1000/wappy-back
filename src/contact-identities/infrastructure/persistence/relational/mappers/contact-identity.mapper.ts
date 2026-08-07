import { ContactIdentity } from '../../../../domain/contact-identity';

import { ContactIdentityEntity } from '../entities/contact-identity.entity';

export class ContactIdentityMapper {
  static toDomain(raw: ContactIdentityEntity): ContactIdentity {
    const domainEntity = new ContactIdentity();
    domainEntity.phone = raw.phone;

    domainEntity.profileName = raw.profileName;

    domainEntity.handle = raw.handle;

    domainEntity.externalId = raw.externalId;

    domainEntity.connectionId = raw.connectionId;

    domainEntity.channel = raw.channel;

    domainEntity.contactId = raw.contactId;

    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: ContactIdentity): ContactIdentityEntity {
    const persistenceEntity = new ContactIdentityEntity();
    persistenceEntity.phone = domainEntity.phone;

    persistenceEntity.profileName = domainEntity.profileName;

    persistenceEntity.handle = domainEntity.handle;

    persistenceEntity.externalId = domainEntity.externalId;

    persistenceEntity.connectionId = domainEntity.connectionId;

    persistenceEntity.channel = domainEntity.channel;

    persistenceEntity.contactId = domainEntity.contactId;

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    return persistenceEntity;
  }
}
