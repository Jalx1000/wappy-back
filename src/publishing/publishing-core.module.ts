import { Module } from '@nestjs/common';
import { ChannelProvidersModule } from '../channel-providers/channel-providers.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { AssetsRelationalPersistenceModule } from '../assets/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalFilePersistenceModule } from '../files/infrastructure/persistence/relational/relational-persistence.module';
import { CalendarRelationalPersistenceModule } from '../calendar/infrastructure/persistence/relational/relational-persistence.module';
import { ConnectionsRelationalPersistenceModule } from '../connections/infrastructure/persistence/relational/relational-persistence.module';
import { MediaResolverService } from './media-resolver.service';
import { PublicationsService } from './publications.service';

// Worker-safe core: only persistence + encryption + provider clients, no HTTP
// feature modules (no controllers/guards/queues). Imported by both the HTTP
// PublishingModule and the worker so the publish orchestration is shared.
@Module({
  imports: [
    AssetsRelationalPersistenceModule,
    RelationalFilePersistenceModule,
    CalendarRelationalPersistenceModule,
    ConnectionsRelationalPersistenceModule,
    EncryptionModule,
    ChannelProvidersModule,
  ],
  providers: [MediaResolverService, PublicationsService],
  exports: [MediaResolverService, PublicationsService],
})
export class PublishingCoreModule {}
