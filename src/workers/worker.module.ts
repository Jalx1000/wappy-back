import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import databaseConfig from '../database/config/database.config';
import appConfig from '../config/app.config';
import mailConfig from '../mail/config/mail.config';
import { TypeOrmConfigService } from '../database/typeorm-config.service';
import { DataSource, DataSourceOptions } from 'typeorm';
import {
  QUEUE_EMAILS,
  QUEUE_INSIGHTS,
  QUEUE_MENTIONS,
  QUEUE_PUBLISH,
  QUEUE_REPORTS,
  QUEUE_SYNC_ADS,
  QUEUE_SYNC_SOCIAL,
  QUEUE_SYNC_WEB,
  QUEUE_TOKENS,
} from '../queues/queue-names.constants';
import { SyncSocialProcessor } from './processors/sync-social.processor';
import { SyncWebProcessor } from './processors/sync-web.processor';
import { SyncAdsProcessor } from './processors/sync-ads.processor';
import { TokenRefreshProcessor } from './processors/token-refresh.processor';
import { TokenRefreshCronService } from './token-refresh-cron.service';
import { WebSyncCronService } from './web-sync-cron.service';
import { DiscoveryCleanupCronService } from './discovery-cleanup-cron.service';
import { OAuthDiscoveriesRelationalPersistenceModule } from '../oauth/discovery/infrastructure/persistence/relational/relational-persistence.module';
import { ReportProcessor } from './processors/report.processor';
import { InsightProcessor } from './processors/insight.processor';
import { ConnectionsRelationalPersistenceModule } from '../connections/infrastructure/persistence/relational/relational-persistence.module';
import { MetricsRelationalPersistenceModule } from '../metrics/infrastructure/persistence/relational/relational-persistence.module';
import { AnalyticsRelationalPersistenceModule } from '../analytics/infrastructure/persistence/relational/relational-persistence.module';
import { ReportsRelationalPersistenceModule } from '../reports/infrastructure/persistence/relational/relational-persistence.module';
import { InsightsRelationalPersistenceModule } from '../insights/infrastructure/persistence/relational/relational-persistence.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { ChannelProvidersModule } from '../channel-providers/channel-providers.module';
import { ReportBuilderModule } from '../reports/report-builder.module';
import { MailerModule } from '../mailer/mailer.module';
import { RelationalUserPersistenceModule } from '../users/infrastructure/persistence/relational/relational-persistence.module';
import { ReportPdfService } from '../reports/report-pdf.service';
import { ReportEmailService } from '../reports/report-email.service';
import { ReportScheduleCronService } from './report-schedule-cron.service';
import { PublishingCoreModule } from '../publishing/publishing-core.module';
import { CalendarRelationalPersistenceModule } from '../calendar/infrastructure/persistence/relational/relational-persistence.module';
import { PublishScheduleCronService } from './publish-schedule-cron.service';
import { PublishProcessor } from './processors/publish.processor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig, mailConfig],
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options: DataSourceOptions) => {
        return new DataSource(options).initialize();
      },
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('WORKER_HOST', 'redis://redis:6379/1'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 500 },
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: QUEUE_SYNC_SOCIAL },
      { name: QUEUE_SYNC_ADS },
      { name: QUEUE_SYNC_WEB },
      { name: QUEUE_TOKENS },
      { name: QUEUE_REPORTS },
      { name: QUEUE_EMAILS },
      { name: QUEUE_MENTIONS },
      { name: QUEUE_INSIGHTS },
      { name: QUEUE_PUBLISH },
    ),
    ConnectionsRelationalPersistenceModule,
    CalendarRelationalPersistenceModule,
    PublishingCoreModule,
    MetricsRelationalPersistenceModule,
    AnalyticsRelationalPersistenceModule,
    ReportsRelationalPersistenceModule,
    InsightsRelationalPersistenceModule,
    OAuthDiscoveriesRelationalPersistenceModule,
    EncryptionModule,
    ChannelProvidersModule,
    ReportBuilderModule,
    MailerModule,
    RelationalUserPersistenceModule,
  ],
  providers: [
    SyncSocialProcessor,
    SyncWebProcessor,
    SyncAdsProcessor,
    TokenRefreshProcessor,
    TokenRefreshCronService,
    WebSyncCronService,
    DiscoveryCleanupCronService,
    ReportProcessor,
    InsightProcessor,
    ReportPdfService,
    ReportEmailService,
    ReportScheduleCronService,
    PublishScheduleCronService,
    PublishProcessor,
  ],
})
export class WorkerModule {}
