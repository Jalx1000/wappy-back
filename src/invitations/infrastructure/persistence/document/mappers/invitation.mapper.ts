import { Invitation } from '../../../../domain/invitation';

import { InvitationSchemaClass } from '../entities/invitation.schema';

export class InvitationMapper {
  public static toDomain(raw: InvitationSchemaClass): Invitation {
    const domainEntity = new Invitation();
    domainEntity.invitedByUserId = raw.invitedByUserId;

    domainEntity.brandId = raw.brandId;

    domainEntity.status = raw.status;

    domainEntity.token = raw.token;

    domainEntity.role = raw.role;

    domainEntity.phone = raw.phone;

    domainEntity.email = raw.email;

    domainEntity.id = raw._id.toString();
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  public static toPersistence(domainEntity: Invitation): InvitationSchemaClass {
    const persistenceSchema = new InvitationSchemaClass();
    persistenceSchema.invitedByUserId = domainEntity.invitedByUserId;

    persistenceSchema.brandId = domainEntity.brandId;

    persistenceSchema.status = domainEntity.status;

    persistenceSchema.token = domainEntity.token;

    persistenceSchema.role = domainEntity.role;

    persistenceSchema.phone = domainEntity.phone;

    persistenceSchema.email = domainEntity.email;

    if (domainEntity.id) {
      persistenceSchema._id = domainEntity.id;
    }
    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;

    return persistenceSchema;
  }
}
