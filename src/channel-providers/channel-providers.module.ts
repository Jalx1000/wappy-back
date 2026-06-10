import { Module } from '@nestjs/common';
import { MockChannelProvider } from './mock-channel.provider';
import { MetaFacebookPageProvider } from './providers/meta/meta-facebook-page.provider';
import { MetaInstagramProvider } from './providers/meta/meta-instagram.provider';
import { TiktokProvider } from './providers/tiktok/tiktok.provider';
import { LinkedinProvider } from './providers/linkedin/linkedin.provider';
import { YoutubeProvider } from './providers/youtube/youtube.provider';
import { GoogleAdsProvider } from './providers/google-ads/google-ads.provider';
import { Ga4Provider } from './providers/ga4/ga4.provider';

export const CHANNEL_PROVIDERS = 'CHANNEL_PROVIDERS';

@Module({
  providers: [
    MockChannelProvider,
    MetaFacebookPageProvider,
    MetaInstagramProvider,
    TiktokProvider,
    LinkedinProvider,
    YoutubeProvider,
    GoogleAdsProvider,
    Ga4Provider,
    {
      provide: CHANNEL_PROVIDERS,
      useFactory: (
        metaFbPage: MetaFacebookPageProvider,
        metaIg: MetaInstagramProvider,
        tiktok: TiktokProvider,
        linkedin: LinkedinProvider,
        youtube: YoutubeProvider,
        googleAds: GoogleAdsProvider,
        ga4: Ga4Provider,
        mock: MockChannelProvider,
      ) => [metaFbPage, metaIg, tiktok, linkedin, youtube, googleAds, ga4, mock],
      inject: [
        MetaFacebookPageProvider,
        MetaInstagramProvider,
        TiktokProvider,
        LinkedinProvider,
        YoutubeProvider,
        GoogleAdsProvider,
        Ga4Provider,
        MockChannelProvider,
      ],
    },
  ],
  exports: [CHANNEL_PROVIDERS],
})
export class ChannelProvidersModule {}
