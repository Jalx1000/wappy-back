import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportsRelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { BrandsModule } from '../brands/brands.module';
import { QueueModule } from '../queues/queue.module';

@Module({
  imports: [ReportsRelationalPersistenceModule, BrandsModule, QueueModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService, ReportsRelationalPersistenceModule],
})
export class ReportsModule {}
