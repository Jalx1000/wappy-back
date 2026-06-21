import { Module } from '@nestjs/common';
import { ChannelProvidersModule } from '../channel-providers/channel-providers.module';
import { ConnectionsModule } from '../connections/connections.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { AssetsModule } from '../assets/assets.module';
import { FilesModule } from '../files/files.module';
import { BrandsModule } from '../brands/brands.module';
import { CalendarModule } from '../calendar/calendar.module';
import { MediaResolverService } from './media-resolver.service';
import { PublicationsService } from './publications.service';
import { TiktokPublishController } from './tiktok-publish.controller';
import { PublicationsController } from './publications.controller';

@Module({
  imports: [
    ChannelProvidersModule,
    ConnectionsModule,
    EncryptionModule,
    AssetsModule,
    FilesModule,
    BrandsModule,
    CalendarModule,
  ],
  controllers: [TiktokPublishController, PublicationsController],
  providers: [MediaResolverService, PublicationsService],
  exports: [MediaResolverService, PublicationsService],
})
export class PublishingModule {}
