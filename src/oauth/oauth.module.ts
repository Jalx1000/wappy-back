import { Module } from '@nestjs/common';
import { OAuthStateService } from './oauth-state.service';
import { OAuthController } from './oauth.controller';
import { OAUTH_SERVICES } from './oauth-provider.interface';
import { OAuthDiscoveriesRelationalPersistenceModule } from './discovery/infrastructure/persistence/relational/relational-persistence.module';
import { OAuthDiscoveriesService } from './discovery/oauth-discoveries.service';
import { OAuthDiscoveriesController } from './discovery/oauth-discoveries.controller';
import { OrphanAccountsModule } from '../connections/orphan/orphan-accounts.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { MetaOAuthService } from '../channel-providers/providers/meta/meta-oauth.service';
import { MetaAdsOAuthService } from '../channel-providers/providers/meta/meta-ads-oauth.service';
import { InstagramLoginOAuthService } from '../channel-providers/providers/instagram-login/instagram-login-oauth.service';
import { TiktokOAuthService } from '../channel-providers/providers/tiktok/tiktok-oauth.service';
import { TiktokAdsOAuthService } from '../channel-providers/providers/tiktok-ads/tiktok-ads-oauth.service';
import { LinkedinOAuthService } from '../channel-providers/providers/linkedin/linkedin-oauth.service';
import { LinkedinAdsOAuthService } from '../channel-providers/providers/linkedin-ads/linkedin-ads-oauth.service';
import { YoutubeOAuthService } from '../channel-providers/providers/youtube/youtube-oauth.service';
import { GoogleAdsOAuthService } from '../channel-providers/providers/google-ads/google-ads-oauth.service';
import { Ga4OAuthService } from '../channel-providers/providers/ga4/ga4-oauth.service';
import { ConnectionsModule } from '../connections/connections.module';

@Module({
  imports: [
    ConnectionsModule,
    OrphanAccountsModule,
    OAuthDiscoveriesRelationalPersistenceModule,
    EncryptionModule,
  ],
  controllers: [OAuthController, OAuthDiscoveriesController],
  providers: [
    OAuthStateService,
    OAuthDiscoveriesService,
    MetaOAuthService,
    MetaAdsOAuthService,
    InstagramLoginOAuthService,
    TiktokOAuthService,
    TiktokAdsOAuthService,
    LinkedinOAuthService,
    LinkedinAdsOAuthService,
    YoutubeOAuthService,
    GoogleAdsOAuthService,
    Ga4OAuthService,
    {
      provide: OAUTH_SERVICES,
      useFactory: (
        meta: MetaOAuthService,
        metaAds: MetaAdsOAuthService,
        igLogin: InstagramLoginOAuthService,
        tiktok: TiktokOAuthService,
        tiktokAds: TiktokAdsOAuthService,
        linkedin: LinkedinOAuthService,
        linkedinAds: LinkedinAdsOAuthService,
        youtube: YoutubeOAuthService,
        googleAds: GoogleAdsOAuthService,
        ga4: Ga4OAuthService,
      ) => [
        meta,
        metaAds,
        igLogin,
        tiktok,
        tiktokAds,
        linkedin,
        linkedinAds,
        youtube,
        googleAds,
        ga4,
      ],
      inject: [
        MetaOAuthService,
        MetaAdsOAuthService,
        InstagramLoginOAuthService,
        TiktokOAuthService,
        TiktokAdsOAuthService,
        LinkedinOAuthService,
        LinkedinAdsOAuthService,
        YoutubeOAuthService,
        GoogleAdsOAuthService,
        Ga4OAuthService,
      ],
    },
  ],
})
export class OAuthModule {}
