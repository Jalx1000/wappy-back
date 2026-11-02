import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { ProductsService } from '../../products/products.service';
import { ApiKeyGuard } from '../../api-keys/guards/api-key.guard';
import { IdempotencyInterceptor } from '../idempotency/idempotency.interceptor';
import { Brand } from '../../brands/domain/brand';
import { CreateIntegrationProductDto } from './dto/create-integration-product.dto';

/**
 * Public integration API — products (contract §2). Auth by API key (Bearer);
 * the key resolves the brand. Rate-limited and idempotent via `Idempotency-Key`.
 * Upsert keyed by `external_id` within the brand so a re-synced catalog never
 * duplicates. Path: `POST /api/v1/integration/products`.
 */
@ApiTags('Integration')
@UseGuards(ApiKeyGuard, ThrottlerGuard)
@UseInterceptors(IdempotencyInterceptor)
@Controller({ path: 'integration/products', version: '1' })
export class IntegrationProductsController {
  constructor(private readonly products: ProductsService) {}

  @Post()
  async upsert(
    @Req() req: { brand: Brand },
    @Body() dto: CreateIntegrationProductDto,
  ): Promise<{ id: string; external_id: string; created: boolean }> {
    const { product, created } = await this.products.upsertFromExternal(
      req.brand.id,
      {
        externalId: dto.external_id,
        sku: dto.sku,
        name: dto.name,
        description: dto.description ?? null,
        price: dto.price,
        stock: dto.stock ?? undefined,
        image: dto.image ?? null,
        isActive: dto.isActive,
        category: dto.category,
        attributes: dto.attributes ?? null,
        origin: dto.origin ?? null,
      },
    );

    return {
      id: product.id,
      external_id: product.externalId as string,
      created,
    };
  }
}
