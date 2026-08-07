import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { AssetEntity } from '../entities/asset.entity';
import { Asset } from '../../../../domain/asset';
import { AssetMapper } from '../mappers/asset.mapper';

@Injectable()
export class AssetsRepository {
  constructor(
    @InjectRepository(AssetEntity)
    private readonly repo: Repository<AssetEntity>,
    private readonly mapper: AssetMapper,
  ) {}

  async findById(id: number): Promise<Asset | null> {
    const entity = await this.repo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByBrand(brandId: number, limit: number = 50): Promise<Asset[]> {
    const entities = await this.repo.find({
      where: { brandId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return entities.map((e) => this.mapper.toDomain(e));
  }

  async findByBrandAndType(
    brandId: number,
    type: string,
    limit: number = 50,
  ): Promise<Asset[]> {
    const entities = await this.repo.find({
      where: { brandId, type, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return entities.map((e) => this.mapper.toDomain(e));
  }

  async findByBrandAndTags(
    brandId: number,
    tags: string[],
    limit: number = 50,
  ): Promise<Asset[]> {
    const query = this.repo
      .createQueryBuilder('a')
      .where('a.brandId = :brandId', { brandId })
      .andWhere('a.deletedAt IS NULL');

    if (tags.length > 0) {
      query.andWhere('a.tags && :tags::text[]', { tags });
    }

    const entities = await query
      .orderBy('a.createdAt', 'DESC')
      .take(limit)
      .getMany();

    return entities.map((e) => this.mapper.toDomain(e));
  }

  async save(domain: Asset): Promise<Asset> {
    const entity = this.mapper.toEntity(domain);
    const saved = await this.repo.save(entity);
    return this.mapper.toDomain(saved);
  }

  async delete(id: number): Promise<void> {
    await this.repo.softDelete(id);
  }
}
