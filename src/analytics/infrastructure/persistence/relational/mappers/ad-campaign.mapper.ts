import { Injectable } from '@nestjs/common';
import { AdCampaign } from '../../../../domain/ad-campaign';
import { AdCampaignEntity } from '../entities/ad-campaign.entity';

@Injectable()
export class AdCampaignMapper {
  toDomain(entity: AdCampaignEntity): AdCampaign {
    const domain = new AdCampaign();
    domain.id = entity.id;
    domain.brandId = entity.brandId;
    domain.connectionId = entity.connectionId;
    domain.externalId = entity.externalId;
    domain.name = entity.name;
    domain.status = entity.status;
    domain.objective = entity.objective;
    domain.budget = entity.budget ? Number(entity.budget) : undefined;
    domain.currency = entity.currency;
    domain.startDate = entity.startDate;
    domain.endDate = entity.endDate;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    return domain;
  }

  toEntity(domain: AdCampaign): AdCampaignEntity {
    const entity = new AdCampaignEntity();
    entity.id = domain.id;
    entity.brandId = domain.brandId;
    entity.connectionId = domain.connectionId;
    entity.externalId = domain.externalId;
    entity.name = domain.name;
    entity.status = domain.status;
    entity.objective = domain.objective;
    entity.budget = domain.budget;
    entity.currency = domain.currency;
    entity.startDate = domain.startDate;
    entity.endDate = domain.endDate;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }
}
