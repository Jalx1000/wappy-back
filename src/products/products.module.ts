import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { RelationalProductPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { BrandsModule } from '../brands/brands.module';
import { WebhookEndpointsModule } from '../webhook-endpoints/webhook-endpoints.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    RelationalProductPersistenceModule,
    BrandsModule,
    WebhookEndpointsModule,
    CategoriesModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService, RelationalProductPersistenceModule],
})
export class ProductsModule {}
