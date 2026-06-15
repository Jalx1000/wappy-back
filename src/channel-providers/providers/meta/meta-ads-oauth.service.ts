import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ChannelEnum } from '../../../connections/domain/channel.enum';
import {
  ChannelOAuthService,
  OAuthAccountResult,
} from '../../../oauth/oauth-provider.interface';

const GRAPH_VERSION_DEFAULT = 'v25.0';

const SCOPES = ['ads_read', 'ads_management', 'business_management'];

interface AdAccount {
  id: string; // act_<n>
  account_id: string; // <n>
  name?: string;
  currency?: string;
  account_status?: number;
  business?: { id?: string; name?: string };
}

@Injectable()
export class MetaAdsOAuthService implements ChannelOAuthService {
  readonly urlChannel = 'meta-ads';
  private readonly logger = new Logger(MetaAdsOAuthService.name);

  constructor(private readonly config: ConfigService) {}

  private get graphVersion(): string {
    return this.config.get<string>('META_GRAPH_VERSION', GRAPH_VERSION_DEFAULT);
  }

  private get graphUrl(): string {
    return `https://graph.facebook.com/${this.graphVersion}`;
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.getOrThrow<string>('META_APP_ID'),
      redirect_uri: this.config.getOrThrow<string>('META_ADS_REDIRECT_URI'),
      scope: SCOPES.join(','),
      state,
      response_type: 'code',
    });
    return `https://www.facebook.com/${this.graphVersion}/dialog/oauth?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<OAuthAccountResult[]> {
    const appId = this.config.getOrThrow<string>('META_APP_ID');
    const appSecret = this.config.getOrThrow<string>('META_APP_SECRET');
    const redirectUri = this.config.getOrThrow<string>(
      'META_ADS_REDIRECT_URI',
    );

    const shortToken = await this.exchangeShort(
      appId,
      appSecret,
      redirectUri,
      code,
    );
    const long = await this.exchangeLong(appId, appSecret, shortToken);
    const accounts = await this.listAdAccounts(long.accessToken);

    if (!accounts.length) {
      this.logger.warn(
        'Meta Ads OAuth: user has no accessible ad accounts (no ads_read on any business)',
      );
    }

    return accounts.map((acc) => ({
      channel: ChannelEnum.meta_ads,
      accountId: acc.account_id,
      accountHandle: acc.name ?? `Ad Account ${acc.account_id}`,
      accessToken: long.accessToken,
      refreshToken: undefined,
      expiresAt: long.expiresAt,
      scopes: SCOPES,
      metadata: {
        actId: acc.id,
        accountId: acc.account_id,
        currency: acc.currency ?? null,
        status: acc.account_status ?? null,
        businessId: acc.business?.id ?? null,
        businessName: acc.business?.name ?? null,
      },
    }));
  }

  private async exchangeShort(
    appId: string,
    appSecret: string,
    redirectUri: string,
    code: string,
  ): Promise<string> {
    const params = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code,
    });
    const { data } = await axios.get<Record<string, unknown>>(
      `${this.graphUrl}/oauth/access_token?${params.toString()}`,
    );
    if (data['error']) {
      throw new Error(`Meta Ads token failed: ${JSON.stringify(data['error'])}`);
    }
    return data['access_token'] as string;
  }

  private async exchangeLong(
    appId: string,
    appSecret: string,
    shortToken: string,
  ): Promise<{ accessToken: string; expiresAt: Date }> {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortToken,
    });
    const { data } = await axios.get<Record<string, unknown>>(
      `${this.graphUrl}/oauth/access_token?${params.toString()}`,
    );
    const expiresIn = (data['expires_in'] as number) ?? 5183944;
    return {
      accessToken: data['access_token'] as string,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  }

  private async listAdAccounts(accessToken: string): Promise<AdAccount[]> {
    const fields = [
      'id',
      'account_id',
      'name',
      'currency',
      'account_status',
      'business',
    ].join(',');
    const params = new URLSearchParams({
      access_token: accessToken,
      fields,
      limit: '100',
    });
    const { data } = await axios.get<{ data?: AdAccount[] }>(
      `${this.graphUrl}/me/adaccounts?${params.toString()}`,
    );
    return data.data ?? [];
  }
}
