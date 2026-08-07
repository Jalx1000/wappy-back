import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ChannelEnum } from '../../../connections/domain/channel.enum';
import {
  ChannelOAuthService,
  OAuthAccountResult,
} from '../../../oauth/oauth-provider.interface';

const AUTH_URL = 'https://business-api.tiktok.com/portal/auth';
const TOKEN_URL =
  'https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/';
const ADVERTISER_INFO_URL =
  'https://business-api.tiktok.com/open_api/v1.3/advertiser/info/';

interface TiktokTokenResponse {
  code: number;
  message: string;
  data: {
    access_token: string;
    advertiser_ids: string[];
    scope: string[];
  };
}

interface TiktokAdvertiserInfoResponse {
  code: number;
  message: string;
  data: {
    list: Array<{
      advertiser_id: string;
      advertiser_account_type?: string;
      name: string;
      currency?: string;
      timezone?: string;
      company?: string | null;
      status?: string;
      country?: string;
    }>;
  };
}

@Injectable()
export class TiktokAdsOAuthService implements ChannelOAuthService {
  readonly urlChannel = 'tiktok_ads';
  private readonly logger = new Logger(TiktokAdsOAuthService.name);

  constructor(private readonly config: ConfigService) {}

  getAuthorizationUrl(state: string): string {
    const appId = this.config.getOrThrow<string>('TIKTOK_BUSINESS_APP_ID');
    const redirectUri = this.config.getOrThrow<string>(
      'TIKTOK_ADS_REDIRECT_URI',
    );
    const params = new URLSearchParams({
      app_id: appId,
      redirect_uri: redirectUri,
      state,
      rid: state, // TikTok requiere request id; reusar el state sirve
    });
    return `${AUTH_URL}?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<OAuthAccountResult[]> {
    const appId = this.config.getOrThrow<string>('TIKTOK_BUSINESS_APP_ID');
    const secret = this.config.getOrThrow<string>('TIKTOK_BUSINESS_APP_SECRET');

    // 1) auth_code → access_token + lista de advertiser_ids
    const { data: tokenResp } = await axios.post<TiktokTokenResponse>(
      TOKEN_URL,
      {
        app_id: appId,
        secret,
        auth_code: code,
      },
    );

    if (tokenResp.code !== 0) {
      throw new Error(
        `TikTok Ads token exchange failed (code=${tokenResp.code}): ${tokenResp.message}`,
      );
    }

    const accessToken = tokenResp.data.access_token;
    const advertiserIds = tokenResp.data.advertiser_ids ?? [];
    const scopes = tokenResp.data.scope ?? [
      'advertiser.read',
      'campaign.read',
      'reporting.read',
    ];

    if (!advertiserIds.length) {
      this.logger.warn(
        'TikTok Ads OAuth completed but user has no accessible advertiser accounts',
      );
      return [];
    }

    // 2) Info de cada advertiser (puede haber varios)
    const { data: infoResp } = await axios.get<TiktokAdvertiserInfoResponse>(
      ADVERTISER_INFO_URL,
      {
        params: {
          advertiser_ids: JSON.stringify(advertiserIds),
          fields: JSON.stringify([
            'advertiser_id',
            'name',
            'currency',
            'timezone',
            'company',
            'status',
            'country',
            'advertiser_account_type',
          ]),
        },
        headers: { 'Access-Token': accessToken },
      },
    );

    if (infoResp.code !== 0) {
      throw new Error(
        `TikTok Ads advertiser info failed (code=${infoResp.code}): ${infoResp.message}`,
      );
    }

    return infoResp.data.list.map((adv) => ({
      channel: ChannelEnum.tiktok_ads,
      accountId: adv.advertiser_id,
      accountHandle: adv.name,
      accessToken,
      refreshToken: undefined,
      expiresAt: undefined,
      scopes,
      metadata: {
        advertiserId: adv.advertiser_id,
        advertiserName: adv.name,
        accountType: adv.advertiser_account_type ?? null,
        currency: adv.currency ?? null,
        timezone: adv.timezone ?? null,
        country: adv.country ?? null,
        company: adv.company ?? null,
        status: adv.status ?? null,
      },
    }));
  }
}
