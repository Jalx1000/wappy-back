import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from '../../../../domain/brand';
import { BrandEntity } from '../entities/brand.entity';
import { BrandSettingsEntity } from '../entities/brand-settings.entity';
import { BrandMapper } from '../mappers/brand.mapper';
import { NullableType } from '../../../../../utils/types/nullable.type';

@Injectable()
export class BrandsRepository {
  constructor(
    @InjectRepository(BrandEntity)
    private readonly repo: Repository<BrandEntity>,
    @InjectRepository(BrandSettingsEntity)
    private readonly settingsRepo: Repository<BrandSettingsEntity>,
  ) {}

  async create(data: Brand): Promise<Brand> {
    const entity = await this.repo.save(
      this.repo.create(BrandMapper.toPersistence(data)),
    );
    return BrandMapper.toDomain(entity);
  }

  async findById(id: number): Promise<NullableType<Brand>> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: { settings: true },
    });
    return entity ? BrandMapper.toDomain(entity) : null;
  }

  // Resolve a brand even if it was archived (soft-deleted) — used by reports so
  // the document always shows the real brand name.
  async findByIdIncludingDeleted(id: number): Promise<NullableType<Brand>> {
    const entity = await this.repo.findOne({
      where: { id },
      withDeleted: true,
    });
    return entity ? BrandMapper.toDomain(entity) : null;
  }

  async findBySlug(slug: string): Promise<NullableType<Brand>> {
    const entity = await this.repo.findOne({ where: { slug } });
    return entity ? BrandMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<Brand[]> {
    const entities = await this.repo.find({
      where: { isActive: true },
      relations: { settings: true },
      order: { id: 'ASC' },
    });
    return entities.map(BrandMapper.toDomain);
  }

  async update(id: number, data: Partial<Brand>): Promise<Brand> {
    await this.repo.update(id, data);
    const entity = await this.repo.findOneOrFail({
      where: { id },
      relations: { settings: true },
    });
    return BrandMapper.toDomain(entity);
  }

  // brand_settings is a lazy 1:1 — most brands never had a row until they set
  // a logo, so this upserts instead of assuming one exists.
  async updateSettings(
    brandId: number,
    patch: Partial<
      Pick<BrandSettingsEntity, 'logoPath' | 'primaryColor' | 'contactEmail'>
    >,
  ): Promise<void> {
    const existing = await this.settingsRepo.findOne({ where: { brandId } });
    if (existing) {
      await this.settingsRepo.update(existing.id, patch);
    } else {
      await this.settingsRepo.save(
        this.settingsRepo.create({ brandId, ...patch }),
      );
    }
  }

  async softDelete(id: number): Promise<void> {
    await this.repo.softDelete(id);
  }
}
