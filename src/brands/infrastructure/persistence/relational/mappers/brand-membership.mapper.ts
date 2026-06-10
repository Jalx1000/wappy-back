import { BrandMembership } from '../../../../domain/brand-membership';
import { BrandMembershipEntity } from '../entities/brand-membership.entity';

export class BrandMembershipMapper {
  static toDomain(raw: BrandMembershipEntity): BrandMembership {
    const domain = new BrandMembership();
    domain.id = raw.id;
    domain.userId = raw.userId;
    domain.brandId = raw.brandId;
    domain.role = raw.role;
    domain.createdAt = raw.createdAt;
    domain.updatedAt = raw.updatedAt;
    return domain;
  }

  static toPersistence(domain: BrandMembership): BrandMembershipEntity {
    const entity = new BrandMembershipEntity();
    if (domain.id) entity.id = domain.id;
    entity.userId = domain.userId;
    entity.brandId = domain.brandId;
    entity.role = domain.role;
    return entity;
  }
}
