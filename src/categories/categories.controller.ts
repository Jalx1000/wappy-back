import { Controller, Get, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Category } from './domain/category';
import { AuthGuard } from '@nestjs/passport';
import { BrandGuard } from '../brands/guards/brand.guard';
import { CurrentBrand } from '../brands/decorators/current-brand.decorator';
import { Brand } from '../brands/domain/brand';

/**
 * Categories are a flat, brand-scoped taxonomy materialized from product writes
 * (see CategoriesService.findOrCreate). This endpoint is read-only: it lists the
 * active brand's categories to power the product form combobox and catalog
 * filters. Creation happens implicitly when a product is saved — there is no
 * manual CRUD here, which also keeps categories strictly brand-scoped.
 */
@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), BrandGuard)
@Controller({
  path: 'categories',
  version: '1',
})
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOkResponse({ type: [Category] })
  findAll(@CurrentBrand() brand: Brand): Promise<Category[]> {
    return this.categoriesService.findAllByBrand(brand.id);
  }
}
