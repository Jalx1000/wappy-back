import { Module } from '@nestjs/common';
import { ChannelProvidersModule } from '../channel-providers/channel-providers.module';
import { ConnectionsModule } from '../connections/connections.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { AssetsModule } from '../assets/assets.module';
import { FilesModule } from '../files/files.module';
import { BrandsModule } from '../brands/brands.module';
import { MediaResolverService } from './media-resolver.service';
import { TiktokPublishController } from './tiktok-publish.controller';

@Module({
  imports: [
    ChannelProvidersModule,
    ConnectionsModule,
    EncryptionModule,
    AssetsModule,
    FilesModule,
    BrandsModule,
  ],
  controllers: [TiktokPublishController],
  providers: [MediaResolverService],
  exports: [MediaResolverService],
})
export class PublishingModule {}
