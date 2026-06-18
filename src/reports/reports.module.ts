import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportSchedulesController } from './report-schedules.controller';
import { ReportSchedulesService } from './report-schedules.service';
import { ReportsRelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { BrandsModule } from '../brands/brands.module';
import { QueueModule } from '../queues/queue.module';

@Module({
  imports: [ReportsRelationalPersistenceModule, BrandsModule, QueueModule],
  controllers: [ReportsController, ReportSchedulesController],
  providers: [ReportsService, ReportSchedulesService],
  exports: [ReportsService, ReportSchedulesService, ReportsRelationalPersistenceModule],
})
export class ReportsModule {}
