import { Injectable } from '@nestjs/common';
import { Asset } from '../../../../domain/asset';
import { AssetEntity } from '../entities/asset.entity';

@Injectable()
export class AssetMapper {
  toDomain(entity: AssetEntity): Asset {
    const domain = new Asset();
    domain.id = entity.id;
    domain.brandId = entity.brandId;
    domain.name = entity.name;
    domain.type = entity.type;
    domain.mimeType = entity.mimeType;
    domain.fileId = entity.fileId;
    domain.tags = entity.tags;
    domain.metadata = entity.metadata;
    domain.uploadedByUserId = entity.uploadedByUserId;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;
    return domain;
  }

  toEntity(domain: Asset): AssetEntity {
    const entity = new AssetEntity();
    entity.id = domain.id;
    entity.brandId = domain.brandId;
    entity.name = domain.name;
    entity.type = domain.type;
    entity.mimeType = domain.mimeType;
    entity.fileId = domain.fileId;
    entity.tags = domain.tags;
    entity.metadata = domain.metadata;
    entity.uploadedByUserId = domain.uploadedByUserId;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    entity.deletedAt = domain.deletedAt;
    return entity;
  }
}
