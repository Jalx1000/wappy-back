import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdCampaignEntity } from './entities/ad-campaign.entity';
import { AdMetricSnapshotEntity } from './entities/ad-metric-snapshot.entity';
import { WebDimensionSnapshotEntity } from './entities/web-dimension-snapshot.entity';
import { AdCampaignMapper } from './mappers/ad-campaign.mapper';
import { AdMetricSnapshotMapper } from './mappers/ad-metric-snapshot.mapper';
import { WebDimensionSnapshotMapper } from './mappers/web-dimension-snapshot.mapper';
import { AdCampaignsRepository } from './repositories/ad-campaigns.repository';
import { AdMetricSnapshotsRepository } from './repositories/ad-metric-snapshots.repository';
import { WebDimensionSnapshotsRepository } from './repositories/web-dimension-snapshots.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdCampaignEntity,
      AdMetricSnapshotEntity,
      WebDimensionSnapshotEntity,
    ]),
  ],
  providers: [
    AdCampaignMapper,
    AdMetricSnapshotMapper,
    WebDimensionSnapshotMapper,
    AdCampaignsRepository,
    AdMetricSnapshotsRepository,
    WebDimensionSnapshotsRepository,
  ],
  exports: [
    AdCampaignsRepository,
    AdMetricSnapshotsRepository,
    WebDimensionSnapshotsRepository,
  ],
})
export class AnalyticsRelationalPersistenceModule {}
