import { Brand } from '../../../../domain/brand';
import { BrandEntity } from '../entities/brand.entity';

export class BrandMapper {
  static toDomain(raw: BrandEntity): Brand {
    const domain = new Brand();
    domain.id = raw.id;
    domain.name = raw.name;
    domain.slug = raw.slug;
    domain.description = raw.description;
    domain.isActive = raw.isActive;
    domain.logoPath = raw.settings?.logoPath ?? null;
    domain.createdAt = raw.createdAt;
    domain.updatedAt = raw.updatedAt;
    domain.deletedAt = raw.deletedAt;
    return domain;
  }

  static toPersistence(domain: Brand): BrandEntity {
    const entity = new BrandEntity();
    if (domain.id) entity.id = domain.id;
    entity.name = domain.name;
    entity.slug = domain.slug;
    entity.description = domain.description ?? null;
    entity.isActive = domain.isActive ?? true;
    return entity;
  }
}
