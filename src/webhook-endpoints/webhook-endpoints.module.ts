import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { WebhookEndpointsService } from './webhook-endpoints.service';
import { WebhookDispatchService } from './webhook-dispatch.service';
import { WebhookEndpointsController } from './webhook-endpoints.controller';
import { BrandGuard } from '../brands/guards/brand.guard';
import { BrandsModule } from '../brands/brands.module';
import { RelationalWebhookEndpointPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    // do not remove this comment
    RelationalWebhookEndpointPersistenceModule,
    BrandsModule,
  ],
  controllers: [WebhookEndpointsController],
  providers: [WebhookEndpointsService, WebhookDispatchService, BrandGuard],
  exports: [
    WebhookEndpointsService,
    WebhookDispatchService,
    RelationalWebhookEndpointPersistenceModule,
  ],
})
export class WebhookEndpointsModule {}
