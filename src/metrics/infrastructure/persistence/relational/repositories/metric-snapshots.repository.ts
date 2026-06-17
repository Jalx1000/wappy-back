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
    // Collapse rows that share the ON CONFLICT key (connectionId, metric, date)
    // to the last one. Providers split insight ranges into windows whose edge day
    // can appear twice; Postgres rejects an ON CONFLICT batch that touches the
    // same row twice ("cannot affect row a second time").
    const byKey = new Map<string, MetricSnapshot>();
    for (const s of snapshots) {
      const t = s.date instanceof Date ? s.date.getTime() : new Date(s.date).getTime();
      byKey.set(`${s.connectionId}|${s.metric}|${t}`, s);
    }
    const entities = [...byKey.values()].map(MetricSnapshotMapper.toPersistence);
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
