import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Insight } from '../../../../domain/insight';
import { InsightEntity } from '../entities/insight.entity';
import { InsightMapper } from '../mappers/insight.mapper';

@Injectable()
export class InsightsRepository {
  constructor(
    @InjectRepository(InsightEntity)
    private readonly repo: Repository<InsightEntity>,
  ) {}

  async upsert(insight: Partial<Insight>): Promise<Insight> {
    const entity = this.repo.create(InsightMapper.toPersistence(insight));
    const saved = await this.repo
      .createQueryBuilder()
      .insert()
      .into(InsightEntity)
      .values(entity)
      .orUpdate(['summary', 'recommendations'], ['brandId', 'period'])
      .returning('*')
      .execute();

    const row = saved.generatedMaps[0] as InsightEntity;
    const found = await this.repo.findOneOrFail({ where: { id: row.id } });
    return InsightMapper.toDomain(found);
  }

  async findByBrandId(brandId: number): Promise<Insight[]> {
    const entities = await this.repo.find({
      where: { brandId },
      order: { createdAt: 'DESC' },
    });
    return entities.map(InsightMapper.toDomain);
  }
}
