import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { Product } from '../../../../domain/product';
import { ProductRepository } from '../../product.repository';
import { ProductMapper } from '../mappers/product.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class ProductRelationalRepository implements ProductRepository {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  async create(data: Product): Promise<Product> {
    const persistenceModel = ProductMapper.toPersistence(data);
    const newEntity = await this.productRepository.save(
      this.productRepository.create(persistenceModel),
    );
    return ProductMapper.toDomain(newEntity);
  }

  async findAllWithPagination({
    paginationOptions,
    brandId,
  }: {
    paginationOptions: IPaginationOptions;
    brandId?: number;
  }): Promise<Product[]> {
    const entities = await this.productRepository.find({
      where: brandId ? { brandId } : {},
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      relations: ['brand'],
    });

    return entities.map((entity) => ProductMapper.toDomain(entity));
  }

  async findById(id: Product['id']): Promise<NullableType<Product>> {
    const entity = await this.productRepository.findOne({
      where: { id },
    });

    return entity ? ProductMapper.toDomain(entity) : null;
  }

  async findByIds(ids: Product['id'][]): Promise<Product[]> {
    const entities = await this.productRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => ProductMapper.toDomain(entity));
  }

  async update(id: Product['id'], payload: Partial<Product>): Promise<Product> {
    const entity = await this.productRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Record not found');
    }

    const updatedEntity = await this.productRepository.save(
      this.productRepository.create(
        ProductMapper.toPersistence({
          ...ProductMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return ProductMapper.toDomain(updatedEntity);
  }

  async remove(id: Product['id']): Promise<void> {
    await this.productRepository.delete(id);
  }
}
