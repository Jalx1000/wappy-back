import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { WebDimensionSnapshotEntity } from '../entities/web-dimension-snapshot.entity';
import { WebDimensionSnapshot } from '../../../../domain/web-dimension-snapshot';
import { WebDimensionSnapshotMapper } from '../mappers/web-dimension-snapshot.mapper';
import { WebDimensionEnum } from '../../../../domain/web-dimension.enum';

export interface DimensionAggregate {
  dimensionValue: string;
  sessions: number;
  users: number;
  conversions: number;
}

@Injectable()
export class WebDimensionSnapshotsRepository {
  constructor(
    @InjectRepository(WebDimensionSnapshotEntity)
    private readonly repo: Repository<WebDimensionSnapshotEntity>,
    private readonly mapper: WebDimensionSnapshotMapper,
  ) {}

  async upsertMany(snapshots: WebDimensionSnapshot[]): Promise<void> {
    if (!snapshots.length) return;
    const entities = snapshots.map((s) => this.mapper.toEntity(s));
    await this.repo
      .createQueryBuilder()
      .insert()
      .into(WebDimensionSnapshotEntity)
      .values(entities as never)
      .orUpdate(
        ['sessions', 'users', 'conversions', 'updated_at'],
        ['connection_id', 'date', 'dimension', 'dimension_value'],
      )
      .execute();
  }

  async topByDimension(
    brandId: number,
    connectionId: number,
    dimension: WebDimensionEnum,
    from: Date,
    to: Date,
    limit: number,
    dimensionValueFilter?: string,
  ): Promise<DimensionAggregate[]> {
    const qb = this.repo
      .createQueryBuilder('w')
      .select('w.dimension_value', 'dimensionValue')
      .addSelect('SUM(w.sessions)', 'sessions')
      .addSelect('SUM(w.users)', 'users')
      .addSelect('SUM(w.conversions)', 'conversions')
      .where('w.brand_id = :brandId', { brandId })
      .andWhere('w.connection_id = :connectionId', { connectionId })
      .andWhere('w.dimension = :dimension', { dimension })
      .andWhere('w.date BETWEEN :from AND :to', { from, to })
      .groupBy('w.dimension_value')
      .orderBy('SUM(w.sessions)', 'DESC')
      .limit(limit);

    if (dimensionValueFilter) {
      qb.andWhere('w.dimension_value = :dvFilter', {
        dvFilter: dimensionValueFilter,
      });
    }

    const rows = await qb.getRawMany<{
      dimensionValue: string;
      sessions: string;
      users: string;
      conversions: string;
    }>();

    return rows.map((r) => ({
      dimensionValue: r.dimensionValue,
      sessions: Number(r.sessions),
      users: Number(r.users),
      conversions: Number(r.conversions),
    }));
  }

  async listCities(
    brandId: number,
    connectionId: number,
    from: Date,
    to: Date,
  ): Promise<string[]> {
    const rows = await this.repo
      .createQueryBuilder('w')
      .select('DISTINCT w.dimension_value', 'city')
      .where('w.brand_id = :brandId', { brandId })
      .andWhere('w.connection_id = :connectionId', { connectionId })
      .andWhere('w.dimension = :dimension', {
        dimension: WebDimensionEnum.city,
      })
      .andWhere('w.date BETWEEN :from AND :to', { from, to })
      .orderBy('w.dimension_value', 'ASC')
      .getRawMany<{ city: string }>();
    return rows.map((r) => r.city);
  }

  async findByBrandAndRange(
    brandId: number,
    from: Date,
    to: Date,
    dimension?: WebDimensionEnum,
  ): Promise<WebDimensionSnapshot[]> {
    const where: Record<string, unknown> = {
      brandId,
      date: Between(from, to),
    };
    if (dimension) where.dimension = dimension;
    const entities = await this.repo.find({
      where: where as never,
      order: { date: 'ASC' },
    });
    return entities.map((e) => this.mapper.toDomain(e));
  }
}
