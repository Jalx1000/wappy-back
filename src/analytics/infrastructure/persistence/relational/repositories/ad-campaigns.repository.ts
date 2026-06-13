import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdCampaignEntity } from '../entities/ad-campaign.entity';
import { AdCampaign } from '../../../../domain/ad-campaign';
import { AdCampaignMapper } from '../mappers/ad-campaign.mapper';

@Injectable()
export class AdCampaignsRepository {
  constructor(
    @InjectRepository(AdCampaignEntity)
    private readonly repository: Repository<AdCampaignEntity>,
    private readonly mapper: AdCampaignMapper,
  ) {}

  async findById(id: number): Promise<AdCampaign | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByBrandAndConnection(
    brandId: number,
    connectionId?: number,
  ): Promise<AdCampaign[]> {
    const where: { brandId: number; connectionId?: number } = { brandId };
    if (connectionId) where.connectionId = connectionId;
    const entities = await this.repository.find({ where });
    return entities.map((e) => this.mapper.toDomain(e));
  }

  async findByBrandAndExternalId(brandId: number, externalId: string): Promise<AdCampaign | null> {
    const entity = await this.repository.findOne({ where: { brandId, externalId } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async save(domain: AdCampaign): Promise<AdCampaign> {
    const entity = this.mapper.toEntity(domain);
    const saved = await this.repository.save(entity);
    return this.mapper.toDomain(saved);
  }

  async upsertMany(campaigns: AdCampaign[]): Promise<void> {
    const entities = campaigns.map((c) => this.mapper.toEntity(c));
    await this.repository.upsert(entities as any, ['externalId']);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
