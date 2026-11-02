import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { RelationalCategoryPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { BrandsModule } from '../brands/brands.module';
import { BrandGuard } from '../brands/guards/brand.guard';

@Module({
  imports: [
    // do not remove this comment
    RelationalCategoryPersistenceModule,
    BrandsModule,
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService, BrandGuard],
  exports: [CategoriesService, RelationalCategoryPersistenceModule],
})
export class CategoriesModule {}
