import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdCampaignEntity } from './entities/ad-campaign.entity';
import { AdMetricSnapshotEntity } from './entities/ad-metric-snapshot.entity';
import { AdCampaignMapper } from './mappers/ad-campaign.mapper';
import { AdMetricSnapshotMapper } from './mappers/ad-metric-snapshot.mapper';
import { AdCampaignsRepository } from './repositories/ad-campaigns.repository';
import { AdMetricSnapshotsRepository } from './repositories/ad-metric-snapshots.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AdCampaignEntity, AdMetricSnapshotEntity])],
  providers: [
    AdCampaignMapper,
    AdMetricSnapshotMapper,
    AdCampaignsRepository,
    AdMetricSnapshotsRepository,
  ],
  exports: [
    AdCampaignsRepository,
    AdMetricSnapshotsRepository,
  ],
})
export class AnalyticsRelationalPersistenceModule {}
