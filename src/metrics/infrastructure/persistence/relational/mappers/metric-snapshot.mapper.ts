import { MetricSnapshot } from '../../../../domain/metric-snapshot';
import { MetricSnapshotEntity } from '../entities/metric-snapshot.entity';

export class MetricSnapshotMapper {
  static toDomain(raw: MetricSnapshotEntity): MetricSnapshot {
    const domain = new MetricSnapshot();
    domain.id = raw.id;
    domain.connectionId = raw.connectionId;
    domain.brandId = raw.brandId;
    domain.date = raw.date;
    domain.metric = raw.metric;
    domain.value = Number(raw.value);
    domain.createdAt = raw.createdAt;
    domain.updatedAt = raw.updatedAt;
    return domain;
  }

  static toPersistence(domain: MetricSnapshot): MetricSnapshotEntity {
    const entity = new MetricSnapshotEntity();
    if (domain.id) entity.id = domain.id;
    entity.connectionId = domain.connectionId;
    entity.brandId = domain.brandId;
    entity.date = domain.date;
    entity.metric = domain.metric;
    entity.value = domain.value;
    return entity;
  }
}
