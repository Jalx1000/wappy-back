import { Company } from '../../../../domain/company';

import { CompanySchemaClass } from '../entities/company.schema';

export class CompanyMapper {
  public static toDomain(raw: CompanySchemaClass): Company {
    const domainEntity = new Company();
    domainEntity.notes = raw.notes;

    domainEntity.seats = raw.seats;

    domainEntity.plan = raw.plan;

    domainEntity.location = raw.location;

    domainEntity.industry = raw.industry;

    domainEntity.domain = raw.domain;

    domainEntity.brandId = raw.brandId;

    domainEntity.name = raw.name;

    domainEntity.id = raw._id.toString();
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  public static toPersistence(domainEntity: Company): CompanySchemaClass {
    const persistenceSchema = new CompanySchemaClass();
    persistenceSchema.notes = domainEntity.notes;

    persistenceSchema.seats = domainEntity.seats;

    persistenceSchema.plan = domainEntity.plan;

    persistenceSchema.location = domainEntity.location;

    persistenceSchema.industry = domainEntity.industry;

    persistenceSchema.domain = domainEntity.domain;

    persistenceSchema.brandId = domainEntity.brandId;

    persistenceSchema.name = domainEntity.name;

    if (domainEntity.id) {
      persistenceSchema._id = domainEntity.id;
    }
    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;

    return persistenceSchema;
  }
}
