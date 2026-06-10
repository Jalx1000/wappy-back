import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ChannelEnum } from '../../../connections/domain/channel.enum';
import {
  ChannelOAuthService,
  OAuthAccountResult,
} from '../../../oauth/oauth-provider.interface';

const GRAPH_URL = 'https://graph.facebook.com/v19.0';
const SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'instagram_basic',
  'instagram_manage_insights',
  'read_insights',
].join(',');

interface MetaPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: { id: string };
}

@Injectable()
export class MetaOAuthService implements ChannelOAuthService {
  readonly urlChannel = 'meta';

  constructor(private readonly config: ConfigService) {}

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.getOrThrow<string>('META_APP_ID'),
      redirect_uri: this.config.getOrThrow<string>('META_REDIRECT_URI'),
      scope: SCOPES,
      state,
      response_type: 'code',
    });
    return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<OAuthAccountResult[]> {
    const appId = this.config.getOrThrow<string>('META_APP_ID');
    const appSecret = this.config.getOrThrow<string>('META_APP_SECRET');
    const redirectUri = this.config.getOrThrow<string>('META_REDIRECT_URI');

    const shortLived = await this.fetchShortLivedToken(appId, appSecret, redirectUri, code);
    const longLived = await this.fetchLongLivedToken(appId, appSecret, shortLived);
    const pages = await this.fetchUserPages(longLived.accessToken);

    const results: OAuthAccountResult[] = [];

    for (const page of pages) {
      results.push({
        channel: ChannelEnum.facebook_page,
        accountId: page.id,
        accountHandle: page.name,
        accessToken: page.access_token,
        expiresAt: undefined,
        scopes: SCOPES.split(','),
        metadata: { pageId: page.id },
      });

      if (page.instagram_business_account?.id) {
        const igId = page.instagram_business_account.id;
        const igHandle = await this.fetchIgUsername(igId, page.access_token);
        results.push({
          channel: ChannelEnum.instagram,
          accountId: igId,
          accountHandle: igHandle,
          accessToken: longLived.accessToken,
          expiresAt: longLived.expiresAt,
          scopes: SCOPES.split(','),
          metadata: { igUserId: igId, linkedPageId: page.id },
        });
      }
    }

    return results;
  }

  private async fetchShortLivedToken(
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
      `${GRAPH_URL}/oauth/access_token?${params.toString()}`,
    );
    if (data['error']) throw new Error(`Meta token exchange: ${JSON.stringify(data['error'])}`);
    return data['access_token'] as string;
  }

  private async fetchLongLivedToken(
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
      `${GRAPH_URL}/oauth/access_token?${params.toString()}`,
    );
    if (data['error']) throw new Error(`Meta long-lived token: ${JSON.stringify(data['error'])}`);
    const expiresIn = (data['expires_in'] as number) ?? 5183944;
    return {
      accessToken: data['access_token'] as string,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  }

  private async fetchUserPages(accessToken: string): Promise<MetaPage[]> {
    const params = new URLSearchParams({
      access_token: accessToken,
      fields: 'id,name,access_token,instagram_business_account',
    });
    const { data } = await axios.get<{ data: MetaPage[] }>(
      `${GRAPH_URL}/me/accounts?${params.toString()}`,
    );
    if ((data as Record<string, unknown>)['error']) {
      throw new Error(`Meta get pages: ${JSON.stringify((data as Record<string, unknown>)['error'])}`);
    }
    return data.data ?? [];
  }

  private async fetchIgUsername(igUserId: string, pageToken: string): Promise<string> {
    const params = new URLSearchParams({ access_token: pageToken, fields: 'username' });
    const { data } = await axios.get<Record<string, unknown>>(
      `${GRAPH_URL}/${igUserId}?${params.toString()}`,
    );
    return (data['username'] as string) ?? igUserId;
  }
}
