import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { MetricsModule } from '../metrics/metrics.module';
import { BrandsModule } from '../brands/brands.module';
import { AnalyticsRelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { ConnectionsRelationalPersistenceModule } from '../connections/infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    CacheModule.register({ ttl: 300 }),
    MetricsModule,
    BrandsModule,
    AnalyticsRelationalPersistenceModule,
    ConnectionsRelationalPersistenceModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
