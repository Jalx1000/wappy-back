import { Brand } from '../../../../../brands/domain/brand';
import { Product } from '../../../../domain/product';
import { ProductEntity } from '../entities/product.entity';

export class ProductMapper {
  static toDomain(raw: ProductEntity): Product {
    const domainEntity = new Product();
    domainEntity.id = raw.id;
    domainEntity.sku = raw.sku;
    domainEntity.name = raw.name;
    domainEntity.description = raw.description;
    domainEntity.price = Number(raw.price);
    domainEntity.stock = raw.stock;
    domainEntity.image = raw.image;
    domainEntity.isActive = raw.isActive;
    domainEntity.category = raw.category;
    domainEntity.brandId = raw.brandId;
    if (raw.brand) {
      domainEntity.brand = Object.assign(new Brand(), {
        id: raw.brand.id,
        name: raw.brand.name,
        slug: raw.brand.slug,
      });
    }
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Product): ProductEntity {
    const persistenceEntity = new ProductEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.sku = domainEntity.sku;
    persistenceEntity.name = domainEntity.name;
    persistenceEntity.description = domainEntity.description ?? null;
    persistenceEntity.price = domainEntity.price;
    persistenceEntity.stock = domainEntity.stock;
    persistenceEntity.image = domainEntity.image ?? null;
    persistenceEntity.isActive = domainEntity.isActive;
    persistenceEntity.category = domainEntity.category;
    persistenceEntity.brandId = domainEntity.brandId;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    return persistenceEntity;
  }
}
