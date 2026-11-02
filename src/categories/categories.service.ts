import {
  // common
  Injectable,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryRepository } from './infrastructure/persistence/category.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Category } from './domain/category';

@Injectable()
export class CategoriesService {
  constructor(
    // Dependencies here
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    // Do not remove comment below.
    // <creating-property />

    return this.categoryRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
      brandId: createCategoryDto.brandId,

      name: createCategoryDto.name,
    });
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.categoryRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: Category['id']) {
    return this.categoryRepository.findById(id);
  }

  findByIds(ids: Category['id'][]) {
    return this.categoryRepository.findByIds(ids);
  }

  async update(
    id: Category['id'],

    updateCategoryDto: UpdateCategoryDto,
  ) {
    // Do not remove comment below.
    // <updating-property />

    return this.categoryRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      brandId: updateCategoryDto.brandId,

      name: updateCategoryDto.name,
    });
  }

  remove(id: Category['id']) {
    return this.categoryRepository.remove(id);
  }

  /** All categories of a brand, name-sorted. Powers the product form combobox. */
  findAllByBrand(brandId: number): Promise<Category[]> {
    return this.categoryRepository.findAllByBrand(brandId);
  }

  /**
   * Register a category for a brand if it does not exist yet (flat taxonomy
   * materialized from product writes). Idempotent and race-safe: a concurrent
   * insert that trips the unique (brandId, name) index resolves to the existing
   * row. Blank names are ignored.
   */
  async findOrCreate(brandId: number, name: string): Promise<Category | null> {
    const trimmed = (name ?? '').trim();
    if (!trimmed) return null;

    const existing = await this.categoryRepository.findByBrandAndName(
      brandId,
      trimmed,
    );
    if (existing) return existing;

    try {
      return await this.categoryRepository.create({ brandId, name: trimmed });
    } catch {
      // Lost a race on the unique index — the row now exists.
      return this.categoryRepository.findByBrandAndName(brandId, trimmed);
    }
  }
}
