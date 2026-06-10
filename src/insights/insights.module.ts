import { Module } from '@nestjs/common';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
import { InsightsRelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { BrandsModule } from '../brands/brands.module';
import { QueueModule } from '../queues/queue.module';

@Module({
  imports: [InsightsRelationalPersistenceModule, BrandsModule, QueueModule],
  controllers: [InsightsController],
  providers: [InsightsService],
  exports: [InsightsService, InsightsRelationalPersistenceModule],
})
export class InsightsModule {}
