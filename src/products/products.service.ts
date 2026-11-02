import {
  // common
  Injectable,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductRepository } from './infrastructure/persistence/product.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Product, ProductAttribute } from './domain/product';
import {
  WebhookDispatchService,
  WebhookEventType,
} from '../webhook-endpoints/webhook-dispatch.service';
import { CategoriesService } from '../categories/categories.service';

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
    private readonly webhookDispatch: WebhookDispatchService,
    private readonly categories: CategoriesService,
  ) {}

  /**
   * Register a product's category in the brand's flat taxonomy. Derived and
   * best-effort: a registry failure must never break the product write, so it
   * is swallowed (the product row remains the source of truth).
   */
  private async registerCategory(brandId: number, name: string): Promise<void> {
    await this.categories.findOrCreate(brandId, name).catch(() => undefined);
  }

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

    const created = await this.productRepository.create(
      // Do not remove comment below.
      // <creating-property-payload />
      product,
    );
    await this.registerCategory(created.brandId, created.category);
    this.emitProductEvent('product.created', created);
    return created;
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

    const updated = await this.productRepository.update(
      id,
      // Do not remove comment below.
      // <updating-property-payload />
      payload,
    );
    if (updated) {
      if (payload.category) {
        await this.registerCategory(updated.brandId, updated.category);
      }
      this.emitProductEvent('product.updated', updated);
    }
    return updated;
  }

  async remove(id: Product['id']): Promise<void> {
    const existing = await this.productRepository.findById(id);
    await this.productRepository.remove(id);
    if (existing) {
      this.emitProductEvent('product.deleted', existing);
    }
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
      await this.registerCategory(brandId, data.category);
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
    await this.registerCategory(brandId, data.category);
    return { product: createdProduct, created: true };
  }

  /**
   * Soft-delete a product by its external id (sets `isActive=false`). Idempotent:
   * a product that is missing or already inactive resolves without error.
   * See docs/contracts/products-sync.md §2.
   */
  async deactivateByExternalId(
    brandId: number,
    externalId: string,
  ): Promise<{ id: string | null; deactivated: boolean }> {
    const existing = await this.productRepository.findByExternalId(
      brandId,
      externalId,
    );

    if (!existing) {
      return { id: null, deactivated: true };
    }

    if (existing.isActive) {
      await this.productRepository.update(existing.id, { isActive: false });
    }

    return { id: existing.id, deactivated: true };
  }

  /**
   * Fire-and-forget webhook for a product change that originated in Wappy (the
   * dashboard). The external-sync path (`upsertFromExternal` /
   * `deactivateByExternalId`) deliberately does NOT emit, so a change that came
   * from WooCommerce never echoes back (contract §5, anti-loop).
   */
  private emitProductEvent(event: WebhookEventType, product: Product): void {
    void this.webhookDispatch.dispatch(product.brandId, event, {
      id: product.id,
      external_id: product.externalId ?? null,
      sku: product.sku,
      name: product.name,
      description: product.description ?? null,
      price: product.price,
      stock: product.stock,
      image: product.image ?? null,
      isActive: product.isActive,
      category: product.category,
      attributes: product.attributes ?? null,
      origin: 'wappy',
    });
  }
}
