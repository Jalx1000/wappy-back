import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportEntity } from './entities/report.entity';
import { ReportScheduleEntity } from './entities/report-schedule.entity';
import { ReportsRepository } from './repositories/reports.repository';
import { ReportSchedulesRepository } from './repositories/report-schedules.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ReportEntity, ReportScheduleEntity])],
  providers: [ReportsRepository, ReportSchedulesRepository],
  exports: [ReportsRepository, ReportSchedulesRepository],
})
export class ReportsRelationalPersistenceModule {}
