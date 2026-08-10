import { Invitation } from '../../../../domain/invitation';

import { InvitationEntity } from '../entities/invitation.entity';

export class InvitationMapper {
  static toDomain(raw: InvitationEntity): Invitation {
    const domainEntity = new Invitation();
    domainEntity.invitedByUserId = raw.invitedByUserId;

    domainEntity.brandId = raw.brandId;

    domainEntity.status = raw.status;

    domainEntity.token = raw.token;

    domainEntity.role = raw.role;

    domainEntity.phone = raw.phone;

    domainEntity.email = raw.email;

    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Invitation): InvitationEntity {
    const persistenceEntity = new InvitationEntity();
    persistenceEntity.invitedByUserId = domainEntity.invitedByUserId;

    persistenceEntity.brandId = domainEntity.brandId;

    persistenceEntity.status = domainEntity.status;

    persistenceEntity.token = domainEntity.token;

    persistenceEntity.role = domainEntity.role;

    persistenceEntity.phone = domainEntity.phone;

    persistenceEntity.email = domainEntity.email;

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    return persistenceEntity;
  }
}
