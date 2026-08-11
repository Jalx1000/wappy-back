import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { UsersModule } from './users/users.module';
import { FilesModule } from './files/files.module';
import { AuthModule } from './auth/auth.module';
import databaseConfig from './database/config/database.config';
import authConfig from './auth/config/auth.config';
import appConfig from './config/app.config';
import mailConfig from './mail/config/mail.config';
import fileConfig from './files/config/file.config';
import facebookConfig from './auth-facebook/config/facebook.config';
import googleConfig from './auth-google/config/google.config';
import appleConfig from './auth-apple/config/apple.config';
import path from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthAppleModule } from './auth-apple/auth-apple.module';
import { AuthFacebookModule } from './auth-facebook/auth-facebook.module';
import { AuthGoogleModule } from './auth-google/auth-google.module';
import { HeaderResolver, I18nModule } from 'nestjs-i18n';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { MailModule } from './mail/mail.module';
import { HomeModule } from './home/home.module';
import { DataSource, DataSourceOptions } from 'typeorm';
import { AllConfigType } from './config/config.type';
import { SessionModule } from './session/session.module';
import { MailerModule } from './mailer/mailer.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MongooseConfigService } from './database/mongoose-config.service';
import { DatabaseConfig } from './database/config/database-config.type';
import { BrandsModule } from './brands/brands.module';
import { QueueModule } from './queues/queue.module';
import { ConnectionsModule } from './connections/connections.module';
import { MetricsModule } from './metrics/metrics.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { OAuthModule } from './oauth/oauth.module';
import { ReportsModule } from './reports/reports.module';
import { InsightsModule } from './insights/insights.module';
import { PostsModule } from './posts/posts.module';
import { CalendarModule } from './calendar/calendar.module';
import { AssetsModule } from './assets/assets.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { NotificationsModule } from './notifications/notifications.module';
import { InboxModule } from './inbox/inbox.module';
import { PublishingModule } from './publishing/publishing.module';
import { ProductsModule } from './products/products.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
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
} from './queues/queue-names.constants';

// <database-block>
const infrastructureDatabaseModule = (databaseConfig() as DatabaseConfig)
  .isDocumentDatabase
  ? MongooseModule.forRootAsync({
      useClass: MongooseConfigService,
    })
  : TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options: DataSourceOptions) => {
        return new DataSource(options).initialize();
      },
    });
// </database-block>

import { WhatsappConversationsModule } from './whatsapp-conversations/whatsapp-conversations.module';

import { WhatsappMessagesModule } from './whatsapp-messages/whatsapp-messages.module';

import { WhatsappSyncRequestsModule } from './whatsapp-sync-requests/whatsapp-sync-requests.module';

import { ContactsModule } from './contacts/contacts.module';

import { ContactIdentitiesModule } from './contact-identities/contact-identities.module';

import { SocialInboxModule } from './social-inbox/social-inbox.module';

import { MaintenanceModule } from './maintenance/maintenance.module';

import { RealtimeModule } from './realtime/realtime.module';

import { InvitationsModule } from './invitations/invitations.module';

import { TeamsModule } from './teams/teams.module';

import { CompaniesModule } from './companies/companies.module';

@Module({
  imports: [
    CompaniesModule,
    TeamsModule,
    InvitationsModule,
    RealtimeModule,
    MaintenanceModule,
    SocialInboxModule,
    ContactIdentitiesModule,
    ContactsModule,
    WhatsappSyncRequestsModule,
    WhatsappMessagesModule,
    WhatsappConversationsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        authConfig,
        appConfig,
        mailConfig,
        fileConfig,
        facebookConfig,
        googleConfig,
        appleConfig,
      ],
      envFilePath: ['.env'],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000,
        limit: 100,
      },
      {
        name: 'long',
        ttl: 900000,
        limit: 100,
      },
    ]),
    infrastructureDatabaseModule,
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService<AllConfigType>) => ({
        fallbackLanguage: configService.getOrThrow('app.fallbackLanguage', {
          infer: true,
        }),
        loaderOptions: { path: path.join(__dirname, '/i18n/'), watch: true },
      }),
      resolvers: [
        {
          use: HeaderResolver,
          useFactory: (configService: ConfigService<AllConfigType>) => {
            return [
              configService.get('app.headerLanguage', {
                infer: true,
              }),
            ];
          },
          inject: [ConfigService],
        },
      ],
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    UsersModule,
    FilesModule,
    AuthModule,
    AuthFacebookModule,
    AuthGoogleModule,
    AuthAppleModule,
    SessionModule,
    MailModule,
    MailerModule,
    HomeModule,
    BrandsModule,
    QueueModule,
    ConnectionsModule,
    MetricsModule,
    AnalyticsModule,
    OAuthModule,
    ReportsModule,
    InsightsModule,
    PostsModule,
    CalendarModule,
    AssetsModule,
    ApprovalsModule,
    NotificationsModule,
    InboxModule,
    PublishingModule,
    ProductsModule,
    WebhooksModule,
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature(
      { name: QUEUE_SYNC_SOCIAL, adapter: BullMQAdapter },
      { name: QUEUE_SYNC_ADS, adapter: BullMQAdapter },
      { name: QUEUE_SYNC_WEB, adapter: BullMQAdapter },
      { name: QUEUE_TOKENS, adapter: BullMQAdapter },
      { name: QUEUE_REPORTS, adapter: BullMQAdapter },
      { name: QUEUE_EMAILS, adapter: BullMQAdapter },
      { name: QUEUE_MENTIONS, adapter: BullMQAdapter },
      { name: QUEUE_INSIGHTS, adapter: BullMQAdapter },
      { name: QUEUE_PUBLISH, adapter: BullMQAdapter },
    ),
  ],
})
export class AppModule {}
