import {
  // common
  Injectable,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductRepository } from './infrastructure/persistence/product.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Product, ProductAttribute } from './domain/product';

/** Fields an external catalog (e.g. WooCommerce) sends to upsert a product. */
export type ExternalProductInput = {
  externalId: string;
  sku: string;
  name: string;
  description?: string | null;
  price: number;
  stock?: number | null;
  image?: string | null;
  isActive?: boolean;
  category: string;
  attributes?: ProductAttribute[] | null;
  /** Where the change originated; `woocommerce` means it came in via this API. */
  origin?: string | null;
};

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

  /**
   * Upsert a product coming from an external catalog, keyed by
   * `(brandId, externalId)`. Creates when the external id is unseen, updates in
   * place otherwise. See docs/contracts/products-sync.md §2.
   */
  async upsertFromExternal(
    brandId: number,
    data: ExternalProductInput,
  ): Promise<{ product: Product; created: boolean }> {
    const existing = await this.productRepository.findByExternalId(
      brandId,
      data.externalId,
    );

    if (existing) {
      const updated = await this.productRepository.update(existing.id, {
        sku: data.sku,
        name: data.name,
        description: data.description ?? null,
        price: data.price,
        stock: data.stock ?? existing.stock,
        image: data.image ?? null,
        isActive: data.isActive ?? true,
        category: data.category,
        attributes: data.attributes ?? null,
      });
      return { product: updated as Product, created: false };
    }

    const product = new Product();
    product.externalId = data.externalId;
    product.sku = data.sku;
    product.name = data.name;
    product.description = data.description ?? null;
    product.price = data.price;
    product.stock = data.stock ?? 1;
    product.image = data.image ?? null;
    product.isActive = data.isActive ?? true;
    product.category = data.category;
    product.attributes = data.attributes ?? null;
    product.brandId = brandId;

    const createdProduct = await this.productRepository.create(product);
    return { product: createdProduct, created: true };
  }
}
