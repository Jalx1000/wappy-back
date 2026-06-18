import { Module } from '@nestjs/common';
import { ReportBuilderService } from './report-builder.service';
import { BrandsRelationalPersistenceModule } from '../brands/infrastructure/persistence/relational/relational-persistence.module';
import { ConnectionsRelationalPersistenceModule } from '../connections/infrastructure/persistence/relational/relational-persistence.module';
import { MetricsRelationalPersistenceModule } from '../metrics/infrastructure/persistence/relational/relational-persistence.module';
import { AnalyticsRelationalPersistenceModule } from '../analytics/infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    BrandsRelationalPersistenceModule,
    ConnectionsRelationalPersistenceModule,
    MetricsRelationalPersistenceModule,
    AnalyticsRelationalPersistenceModule,
  ],
  providers: [ReportBuilderService],
  exports: [ReportBuilderService],
})
export class ReportBuilderModule {}
