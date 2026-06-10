import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { MetricsModule } from '../metrics/metrics.module';
import { BrandsModule } from '../brands/brands.module';

@Module({
  imports: [
    CacheModule.register({ ttl: 300 }),
    MetricsModule,
    BrandsModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
