import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportEntity } from './entities/report.entity';
import { ReportsRepository } from './repositories/reports.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ReportEntity])],
  providers: [ReportsRepository],
  exports: [ReportsRepository],
})
export class ReportsRelationalPersistenceModule {}
