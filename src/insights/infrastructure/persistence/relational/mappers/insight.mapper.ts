import { Insight } from '../../../../domain/insight';
import { InsightEntity } from '../entities/insight.entity';

export class InsightMapper {
  static toDomain(entity: InsightEntity): Insight {
    const domain = new Insight();
    domain.id = entity.id;
    domain.brandId = entity.brandId;
    domain.connectionId = entity.connectionId;
    domain.period = entity.period;
    domain.summary = entity.summary;
    domain.recommendations = entity.recommendations;
    domain.createdAt = entity.createdAt;
    return domain;
  }

  static toPersistence(domain: Partial<Insight>): Partial<InsightEntity> {
    const entity = new InsightEntity();
    if (domain.brandId !== undefined) entity.brandId = domain.brandId;
    if (domain.connectionId !== undefined)
      entity.connectionId = domain.connectionId;
    if (domain.period !== undefined) entity.period = domain.period;
    if (domain.summary !== undefined) entity.summary = domain.summary;
    if (domain.recommendations !== undefined)
      entity.recommendations = domain.recommendations;
    return entity;
  }
}
