import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { CategoriesService } from '../../categories/categories.service';
import { ApiKeyGuard } from '../../api-keys/guards/api-key.guard';
import { Brand } from '../../brands/domain/brand';
import { CreateIntegrationCategoriesDto } from './dto/create-integration-categories.dto';

/**
 * Public integration API — categories. The external catalog (WooCommerce)
 * pushes its category list so every category is registered in the brand's flat
 * taxonomy and becomes selectable in Wappy, independent of whether a product
 * uses it yet. Auth by API key (Bearer); the key resolves the brand. Naturally
 * idempotent: upsert is find-or-create by name. Path:
 * `POST /api/v1/integration/categories`.
 */
@ApiTags('Integration')
@UseGuards(ApiKeyGuard, ThrottlerGuard)
@Controller({ path: 'integration/categories', version: '1' })
export class IntegrationCategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Post()
  async upsert(
    @Req() req: { brand: Brand },
    @Body() dto: CreateIntegrationCategoriesDto,
  ): Promise<{ categories: string[] }> {
    for (const name of dto.names) {
      await this.categories.findOrCreate(req.brand.id, name);
    }
    const all = await this.categories.findAllByBrand(req.brand.id);
    return { categories: all.map((c) => c.name) };
  }
}
