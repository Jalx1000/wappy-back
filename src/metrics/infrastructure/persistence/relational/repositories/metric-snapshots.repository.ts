import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { MetricSnapshot } from '../../../../domain/metric-snapshot';
import { MetricSnapshotEntity } from '../entities/metric-snapshot.entity';
import { MetricSnapshotMapper } from '../mappers/metric-snapshot.mapper';
import { MetricEnum } from '../../../../domain/metric.enum';

@Injectable()
export class MetricSnapshotsRepository {
  constructor(
    @InjectRepository(MetricSnapshotEntity)
    private readonly repo: Repository<MetricSnapshotEntity>,
  ) {}

  async upsert(snapshot: MetricSnapshot): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .insert()
      .into(MetricSnapshotEntity)
      .values(MetricSnapshotMapper.toPersistence(snapshot))
      .orUpdate(['value', 'updatedAt'], ['connectionId', 'metric', 'date'])
      .execute();
  }

  async upsertMany(snapshots: MetricSnapshot[]): Promise<void> {
    if (!snapshots.length) return;
    const entities = snapshots.map(MetricSnapshotMapper.toPersistence);
    await this.repo
      .createQueryBuilder()
      .insert()
      .into(MetricSnapshotEntity)
      .values(entities)
      .orUpdate(['value', 'updatedAt'], ['connectionId', 'metric', 'date'])
      .execute();
  }

  async findByConnectionAndRange(
    connectionId: number,
    brandId: number,
    from: Date,
    to: Date,
  ): Promise<MetricSnapshot[]> {
    const entities = await this.repo.find({
      where: { connectionId, brandId, date: Between(from, to) },
      order: { date: 'ASC', metric: 'ASC' },
    });
    return entities.map(MetricSnapshotMapper.toDomain);
  }

  async findByBrandAndRange(
    brandId: number,
    from: Date,
    to: Date,
    metric?: MetricEnum,
  ): Promise<MetricSnapshot[]> {
    const where: Record<string, unknown> = { brandId, date: Between(from, to) };
    if (metric) where['metric'] = metric;
    const entities = await this.repo.find({
      where: where as any,
      order: { date: 'ASC' },
    });
    return entities.map(MetricSnapshotMapper.toDomain);
  }
}
