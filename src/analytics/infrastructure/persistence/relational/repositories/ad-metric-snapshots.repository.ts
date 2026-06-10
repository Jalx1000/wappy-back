import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AdMetricSnapshotEntity } from '../entities/ad-metric-snapshot.entity';
import { AdMetricSnapshot } from '../../../../domain/ad-metric-snapshot';
import { AdMetricSnapshotMapper } from '../mappers/ad-metric-snapshot.mapper';

@Injectable()
export class AdMetricSnapshotsRepository {
  constructor(
    @InjectRepository(AdMetricSnapshotEntity)
    private readonly repository: Repository<AdMetricSnapshotEntity>,
    private readonly mapper: AdMetricSnapshotMapper,
  ) {}

  async findByBrandAndDateRange(
    brandId: number,
    from: Date,
    to: Date,
  ): Promise<AdMetricSnapshot[]> {
    const entities = await this.repository.find({
      where: {
        brandId,
        date: Between(from, to),
      },
      order: { date: 'ASC' },
    });
    return entities.map((e) => this.mapper.toDomain(e));
  }

  async findByCampaignAndDateRange(
    campaignId: number,
    from: Date,
    to: Date,
  ): Promise<AdMetricSnapshot[]> {
    const entities = await this.repository.find({
      where: {
        campaignId,
        date: Between(from, to),
      },
      order: { date: 'ASC' },
    });
    return entities.map((e) => this.mapper.toDomain(e));
  }

  async save(domain: AdMetricSnapshot): Promise<AdMetricSnapshot> {
    const entity = this.mapper.toEntity(domain);
    const saved = await this.repository.save(entity);
    return this.mapper.toDomain(saved);
  }

  async upsertMany(snapshots: AdMetricSnapshot[]): Promise<void> {
    const entities = snapshots.map((s) => this.mapper.toEntity(s));
    await this.repository.upsert(entities as any, ['campaignId', 'date']);
  }
}
