import { Module } from '@nestjs/common';
import { OAuthStateService } from './oauth-state.service';
import { OAuthController } from './oauth.controller';
import { OAUTH_SERVICES } from './oauth-provider.interface';
import { MetaOAuthService } from '../channel-providers/providers/meta/meta-oauth.service';
import { TiktokOAuthService } from '../channel-providers/providers/tiktok/tiktok-oauth.service';
import { LinkedinOAuthService } from '../channel-providers/providers/linkedin/linkedin-oauth.service';
import { YoutubeOAuthService } from '../channel-providers/providers/youtube/youtube-oauth.service';
import { GoogleAdsOAuthService } from '../channel-providers/providers/google-ads/google-ads-oauth.service';
import { Ga4OAuthService } from '../channel-providers/providers/ga4/ga4-oauth.service';
import { ConnectionsModule } from '../connections/connections.module';

@Module({
  imports: [ConnectionsModule],
  controllers: [OAuthController],
  providers: [
    OAuthStateService,
    MetaOAuthService,
    TiktokOAuthService,
    LinkedinOAuthService,
    YoutubeOAuthService,
    GoogleAdsOAuthService,
    Ga4OAuthService,
    {
      provide: OAUTH_SERVICES,
      useFactory: (
        meta: MetaOAuthService,
        tiktok: TiktokOAuthService,
        linkedin: LinkedinOAuthService,
        youtube: YoutubeOAuthService,
        googleAds: GoogleAdsOAuthService,
        ga4: Ga4OAuthService,
      ) => [meta, tiktok, linkedin, youtube, googleAds, ga4],
      inject: [
        MetaOAuthService,
        TiktokOAuthService,
        LinkedinOAuthService,
        YoutubeOAuthService,
        GoogleAdsOAuthService,
        Ga4OAuthService,
      ],
    },
  ],
})
export class OAuthModule {}
