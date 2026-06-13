import { Module } from '@nestjs/common';
import { MockChannelProvider } from './mock-channel.provider';
import { MetaFacebookPageProvider } from './providers/meta/meta-facebook-page.provider';
import { MetaInstagramProvider } from './providers/meta/meta-instagram.provider';
import { MetaAdsProvider } from './providers/meta/meta-ads.provider';
import { TiktokProvider } from './providers/tiktok/tiktok.provider';
import { TiktokAdsProvider } from './providers/tiktok-ads/tiktok-ads.provider';
import { LinkedinProvider } from './providers/linkedin/linkedin.provider';
import { LinkedinAdsProvider } from './providers/linkedin-ads/linkedin-ads.provider';
import { YoutubeProvider } from './providers/youtube/youtube.provider';
import { GoogleAdsProvider } from './providers/google-ads/google-ads.provider';
import { Ga4Provider } from './providers/ga4/ga4.provider';

export const CHANNEL_PROVIDERS = 'CHANNEL_PROVIDERS';

@Module({
  providers: [
    MockChannelProvider,
    MetaFacebookPageProvider,
    MetaInstagramProvider,
    MetaAdsProvider,
    TiktokProvider,
    TiktokAdsProvider,
    LinkedinProvider,
    LinkedinAdsProvider,
    YoutubeProvider,
    GoogleAdsProvider,
    Ga4Provider,
    {
      provide: CHANNEL_PROVIDERS,
      useFactory: (
        metaFbPage: MetaFacebookPageProvider,
        metaIg: MetaInstagramProvider,
        metaAds: MetaAdsProvider,
        tiktok: TiktokProvider,
        tiktokAds: TiktokAdsProvider,
        linkedin: LinkedinProvider,
        linkedinAds: LinkedinAdsProvider,
        youtube: YoutubeProvider,
        googleAds: GoogleAdsProvider,
        ga4: Ga4Provider,
        mock: MockChannelProvider,
      ) => [
        metaFbPage,
        metaIg,
        metaAds,
        tiktok,
        tiktokAds,
        linkedin,
        linkedinAds,
        youtube,
        googleAds,
        ga4,
        mock,
      ],
      inject: [
        MetaFacebookPageProvider,
        MetaInstagramProvider,
        MetaAdsProvider,
        TiktokProvider,
        TiktokAdsProvider,
        LinkedinProvider,
        LinkedinAdsProvider,
        YoutubeProvider,
        GoogleAdsProvider,
        Ga4Provider,
        MockChannelProvider,
      ],
    },
  ],
  exports: [
    CHANNEL_PROVIDERS,
    Ga4Provider,
    GoogleAdsProvider,
    MetaAdsProvider,
    TiktokAdsProvider,
    LinkedinAdsProvider,
  ],
})
export class ChannelProvidersModule {}
