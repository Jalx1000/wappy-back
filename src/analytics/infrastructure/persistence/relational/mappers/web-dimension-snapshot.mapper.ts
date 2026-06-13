import { Injectable } from '@nestjs/common';
import { WebDimensionSnapshot } from '../../../../domain/web-dimension-snapshot';
import { WebDimensionSnapshotEntity } from '../entities/web-dimension-snapshot.entity';

@Injectable()
export class WebDimensionSnapshotMapper {
  toDomain(entity: WebDimensionSnapshotEntity): WebDimensionSnapshot {
    const domain = new WebDimensionSnapshot();
    domain.id = entity.id;
    domain.brandId = entity.brandId;
    domain.connectionId = entity.connectionId;
    domain.date = entity.date;
    domain.dimension = entity.dimension;
    domain.dimensionValue = entity.dimensionValue;
    domain.sessions = entity.sessions;
    domain.users = entity.users;
    domain.conversions = Number(entity.conversions);
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    return domain;
  }

  toEntity(domain: WebDimensionSnapshot): WebDimensionSnapshotEntity {
    const entity = new WebDimensionSnapshotEntity();
    if (domain.id) entity.id = domain.id;
    entity.brandId = domain.brandId;
    entity.connectionId = domain.connectionId;
    entity.date = domain.date;
    entity.dimension = domain.dimension;
    entity.dimensionValue = domain.dimensionValue;
    entity.sessions = domain.sessions;
    entity.users = domain.users;
    entity.conversions = domain.conversions;
    return entity;
  }
}
