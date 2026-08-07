import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { RelationalProductPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { BrandsModule } from '../brands/brands.module';

@Module({
  imports: [RelationalProductPersistenceModule, BrandsModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService, RelationalProductPersistenceModule],
})
export class ProductsModule {}
