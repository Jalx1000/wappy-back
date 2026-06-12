import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ChannelEnum } from '../../../connections/domain/channel.enum';
import {
  ChannelOAuthService,
  OAuthAccountResult,
} from '../../../oauth/oauth-provider.interface';

const AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const API_BASE = 'https://api.linkedin.com/v2';

const SCOPES = ['r_ads', 'r_ads_reporting', 'rw_ads'];

@Injectable()
export class LinkedinAdsOAuthService implements ChannelOAuthService {
  readonly urlChannel = 'linkedin_ads';
  private readonly logger = new Logger(LinkedinAdsOAuthService.name);

  constructor(private readonly config: ConfigService) {}

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.getOrThrow<string>('LINKEDIN_ADS_CLIENT_ID'),
      redirect_uri: this.config.getOrThrow<string>('LINKEDIN_ADS_REDIRECT_URI'),
      state,
      scope: SCOPES.join(' '),
    });
    return `${AUTH_URL}?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<OAuthAccountResult[]> {
    const clientId = this.config.getOrThrow<string>('LINKEDIN_ADS_CLIENT_ID');
    const clientSecret = this.config.getOrThrow<string>(
      'LINKEDIN_ADS_CLIENT_SECRET',
    );
    const redirectUri = this.config.getOrThrow<string>(
      'LINKEDIN_ADS_REDIRECT_URI',
    );

    // 1) Exchange code → token
    const { data: tokenResp } = await axios.post<{
      access_token: string;
      expires_in: number;
      refresh_token?: string;
    }>(
      TOKEN_URL,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    const accessToken = tokenResp.access_token;
    const expiresAt = new Date(Date.now() + tokenResp.expires_in * 1000);

    // 2) Listar ad accounts accesibles
    const { data: accountsResp } = await axios.get<{
      elements: Array<{
        id: number;
        name: string;
        currency: string;
        type: string;
        status: string;
        reference?: string;
      }>;
    }>(
      `${API_BASE}/adAccountsV2?q=search&search=(status:(values:List(ACTIVE,DRAFT)))`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      },
    );

    const accounts = accountsResp.elements ?? [];
    if (!accounts.length) {
      this.logger.warn(
        'LinkedIn Ads OAuth completed but user has no accessible ad accounts',
      );
      return [];
    }

    return accounts.map((acc) => ({
      channel: ChannelEnum.linkedin_ads,
      accountId: String(acc.id),
      accountHandle: acc.name,
      accessToken,
      refreshToken: tokenResp.refresh_token,
      expiresAt,
      scopes: SCOPES,
      metadata: {
        adAccountId: acc.id,
        adAccountName: acc.name,
        currency: acc.currency,
        type: acc.type,
        status: acc.status,
        reference: acc.reference ?? null,
      },
    }));
  }
}
