import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from '../../../../domain/brand';
import { BrandEntity } from '../entities/brand.entity';
import { BrandMapper } from '../mappers/brand.mapper';
import { NullableType } from '../../../../../utils/types/nullable.type';

@Injectable()
export class BrandsRepository {
  constructor(
    @InjectRepository(BrandEntity)
    private readonly repo: Repository<BrandEntity>,
  ) {}

  async create(data: Brand): Promise<Brand> {
    const entity = await this.repo.save(
      this.repo.create(BrandMapper.toPersistence(data)),
    );
    return BrandMapper.toDomain(entity);
  }

  async findById(id: number): Promise<NullableType<Brand>> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? BrandMapper.toDomain(entity) : null;
  }

  async findBySlug(slug: string): Promise<NullableType<Brand>> {
    const entity = await this.repo.findOne({ where: { slug } });
    return entity ? BrandMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<Brand[]> {
    const entities = await this.repo.find({ where: { isActive: true } });
    return entities.map(BrandMapper.toDomain);
  }

  async update(id: number, data: Partial<Brand>): Promise<Brand> {
    await this.repo.update(id, data);
    const entity = await this.repo.findOneOrFail({ where: { id } });
    return BrandMapper.toDomain(entity);
  }

  async softDelete(id: number): Promise<void> {
    await this.repo.softDelete(id);
  }
}
