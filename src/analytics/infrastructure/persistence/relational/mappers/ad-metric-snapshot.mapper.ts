import { Injectable } from '@nestjs/common';
import { AdMetricSnapshot } from '../../../../domain/ad-metric-snapshot';
import { AdMetricSnapshotEntity } from '../entities/ad-metric-snapshot.entity';

@Injectable()
export class AdMetricSnapshotMapper {
  toDomain(entity: AdMetricSnapshotEntity): AdMetricSnapshot {
    const domain = new AdMetricSnapshot();
    domain.id = entity.id;
    domain.campaignId = entity.campaignId;
    domain.brandId = entity.brandId;
    domain.date = entity.date;
    domain.spend = Number(entity.spend);
    domain.impressions = entity.impressions;
    domain.clicks = entity.clicks;
    domain.ctr = entity.ctr ? Number(entity.ctr) : undefined;
    domain.cpc = entity.cpc ? Number(entity.cpc) : undefined;
    domain.cpm = entity.cpm ? Number(entity.cpm) : undefined;
    domain.conversions = entity.conversions;
    domain.roas = entity.roas ? Number(entity.roas) : undefined;
    domain.createdAt = entity.createdAt;
    return domain;
  }

  toEntity(domain: AdMetricSnapshot): AdMetricSnapshotEntity {
    const entity = new AdMetricSnapshotEntity();
    entity.id = domain.id;
    entity.campaignId = domain.campaignId;
    entity.brandId = domain.brandId;
    entity.date = domain.date;
    entity.spend = domain.spend;
    entity.impressions = domain.impressions;
    entity.clicks = domain.clicks;
    entity.ctr = domain.ctr;
    entity.cpc = domain.cpc;
    entity.cpm = domain.cpm;
    entity.conversions = domain.conversions;
    entity.roas = domain.roas;
    entity.createdAt = domain.createdAt;
    return entity;
  }
}
