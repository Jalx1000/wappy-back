import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { TypeOrmConfigService } from '../typeorm-config.service';
import databaseConfig from '../config/database.config';
import appConfig from '../../config/app.config';
import fileConfig from '../../files/config/file.config';
import { EncryptionModule } from '../../encryption/encryption.module';
import { FilesModule } from '../../files/files.module';
import { RelationalContactPersistenceModule } from '../../contacts/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalInstagramConversationPersistenceModule } from '../../instagram-conversations/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalMessengerConversationPersistenceModule } from '../../messenger-conversations/infrastructure/persistence/relational/relational-persistence.module';
import { ConnectionsRelationalPersistenceModule } from '../../connections/infrastructure/persistence/relational/relational-persistence.module';
import { MetaProfileService } from '../../webhooks/meta-profile.service';
import { MetaProfileBackfillService } from './meta-profile-backfill.service';

// Self-contained module for the one-off `backfill:meta-profiles` script. Boots
// its own Config + TypeORM connection (same pattern as the seed module) and
// pulls in only the repositories the backfill touches.
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig, fileConfig],
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options: DataSourceOptions) => {
        return new DataSource(options).initialize();
      },
    }),
    EncryptionModule,
    RelationalContactPersistenceModule,
    RelationalInstagramConversationPersistenceModule,
    RelationalMessengerConversationPersistenceModule,
    ConnectionsRelationalPersistenceModule,
    FilesModule,
  ],
  providers: [MetaProfileService, MetaProfileBackfillService],
})
export class BackfillModule {}
