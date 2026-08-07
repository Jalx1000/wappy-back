import {
  // common
  Injectable,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductRepository } from './infrastructure/persistence/product.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Product } from './domain/product';

@Injectable()
export class ProductsService {
  constructor(
    // Dependencies here
    private readonly productRepository: ProductRepository,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Do not remove comment below.
    // <creating-property />

    const product = new Product();
    product.sku = createProductDto.sku;
    product.name = createProductDto.name;
    product.description = createProductDto.description ?? null;
    product.price = createProductDto.price;
    product.stock = createProductDto.stock ?? 1;
    product.image = createProductDto.image ?? null;
    product.isActive = createProductDto.isActive ?? true;
    product.category = createProductDto.category;
    product.brandId = createProductDto.brandId;

    return this.productRepository.create(
      // Do not remove comment below.
      // <creating-property-payload />
      product,
    );
  }

  findAllWithPagination({
    paginationOptions,
    brandId,
  }: {
    paginationOptions: IPaginationOptions;
    brandId?: number;
  }) {
    return this.productRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
      brandId,
    });
  }

  findById(id: Product['id']) {
    return this.productRepository.findById(id);
  }

  findByIds(ids: Product['id'][]) {
    return this.productRepository.findByIds(ids);
  }

  async update(
    id: Product['id'],
    updateProductDto: UpdateProductDto,
  ): Promise<Product | null> {
    // Do not remove comment below.
    // <updating-property />

    const payload: Partial<Product> = {};
    if (updateProductDto.sku !== undefined) payload.sku = updateProductDto.sku;
    if (updateProductDto.name !== undefined)
      payload.name = updateProductDto.name;
    if (updateProductDto.description !== undefined)
      payload.description = updateProductDto.description ?? null;
    if (updateProductDto.price !== undefined)
      payload.price = updateProductDto.price;
    if (updateProductDto.stock !== undefined)
      payload.stock = updateProductDto.stock;
    if (updateProductDto.image !== undefined)
      payload.image = updateProductDto.image ?? null;
    if (updateProductDto.isActive !== undefined)
      payload.isActive = updateProductDto.isActive;
    if (updateProductDto.category !== undefined)
      payload.category = updateProductDto.category;
    if (updateProductDto.brandId !== undefined)
      payload.brandId = updateProductDto.brandId;

    return this.productRepository.update(
      id,
      // Do not remove comment below.
      // <updating-property-payload />
      payload,
    );
  }

  remove(id: Product['id']) {
    return this.productRepository.remove(id);
  }
}
