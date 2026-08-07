import { Contact } from '../../../../domain/contact';

import { ContactEntity } from '../entities/contact.entity';

export class ContactMapper {
  static toDomain(raw: ContactEntity): Contact {
    const domainEntity = new Contact();
    domainEntity.mergedIntoContactId = raw.mergedIntoContactId;

    domainEntity.notes = raw.notes;

    domainEntity.avatarUrl = raw.avatarUrl;

    domainEntity.email = raw.email;

    domainEntity.phone = raw.phone;

    domainEntity.displayName = raw.displayName;

    domainEntity.brandId = raw.brandId;

    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Contact): ContactEntity {
    const persistenceEntity = new ContactEntity();
    persistenceEntity.mergedIntoContactId = domainEntity.mergedIntoContactId;

    persistenceEntity.notes = domainEntity.notes;

    persistenceEntity.avatarUrl = domainEntity.avatarUrl;

    persistenceEntity.email = domainEntity.email;

    persistenceEntity.phone = domainEntity.phone;

    persistenceEntity.displayName = domainEntity.displayName;

    persistenceEntity.brandId = domainEntity.brandId;

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    return persistenceEntity;
  }
}
