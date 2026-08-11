import { Company } from '../../../../domain/company';

import { CompanyEntity } from '../entities/company.entity';

export class CompanyMapper {
  static toDomain(raw: CompanyEntity): Company {
    const domainEntity = new Company();
    domainEntity.notes = raw.notes;

    domainEntity.seats = raw.seats;

    domainEntity.plan = raw.plan;

    domainEntity.location = raw.location;

    domainEntity.industry = raw.industry;

    domainEntity.domain = raw.domain;

    domainEntity.brandId = raw.brandId;

    domainEntity.name = raw.name;

    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Company): CompanyEntity {
    const persistenceEntity = new CompanyEntity();
    persistenceEntity.notes = domainEntity.notes;

    persistenceEntity.seats = domainEntity.seats;

    persistenceEntity.plan = domainEntity.plan;

    persistenceEntity.location = domainEntity.location;

    persistenceEntity.industry = domainEntity.industry;

    persistenceEntity.domain = domainEntity.domain;

    persistenceEntity.brandId = domainEntity.brandId;

    persistenceEntity.name = domainEntity.name;

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    return persistenceEntity;
  }
}
