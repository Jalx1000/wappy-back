import { Module } from '@nestjs/common';
import { ChannelProvidersModule } from '../channel-providers/channel-providers.module';
import { ConnectionsModule } from '../connections/connections.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { BrandsModule } from '../brands/brands.module';
import { PublishingCoreModule } from './publishing-core.module';
import { TiktokPublishController } from './tiktok-publish.controller';
import { PublicationsController } from './publications.controller';

@Module({
  imports: [
    PublishingCoreModule,
    ConnectionsModule,
    EncryptionModule,
    ChannelProvidersModule,
    BrandsModule,
  ],
  controllers: [TiktokPublishController, PublicationsController],
})
export class PublishingModule {}
