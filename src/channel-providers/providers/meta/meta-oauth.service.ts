import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { FacebookAdsApi, User } from 'facebook-nodejs-business-sdk';
import { ChannelEnum } from '../../../connections/domain/channel.enum';
import {
  ChannelOAuthService,
  OAuthAccountResult,
} from '../../../oauth/oauth-provider.interface';

const GRAPH_VERSION = 'v19.0';
const GRAPH_URL = `https://graph.facebook.com/${GRAPH_VERSION}`;

const SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_read_user_content',
  'read_insights',
  'instagram_basic',
  'instagram_manage_insights',
];

interface PageData {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  category_list?: Array<{ id: string; name: string }>;
  instagram_business_account?: {
    id: string;
    username?: string;
    profile_picture_url?: string;
  };
}

@Injectable()
export class MetaOAuthService implements ChannelOAuthService {
  readonly urlChannel = 'meta';
  private readonly logger = new Logger(MetaOAuthService.name);

  constructor(private readonly config: ConfigService) {}

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.getOrThrow<string>('META_APP_ID'),
      redirect_uri: this.config.getOrThrow<string>('META_REDIRECT_URI'),
      scope: SCOPES.join(','),
      state,
      response_type: 'code',
    });
    return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<OAuthAccountResult[]> {
    const appId = this.config.getOrThrow<string>('META_APP_ID');
    const appSecret = this.config.getOrThrow<string>('META_APP_SECRET');
    const redirectUri = this.config.getOrThrow<string>('META_REDIRECT_URI');

    // 1) code → short-lived user token
    const shortLived = await this.fetchShortLivedToken(
      appId,
      appSecret,
      redirectUri,
      code,
    );

    // 2) short-lived → long-lived (~60 days)
    const longLived = await this.fetchLongLivedToken(
      appId,
      appSecret,
      shortLived,
    );

    // 3) Init SDK con el long-lived user token y listar pages (con IG vinculado)
    FacebookAdsApi.init(longLived.accessToken);

    const pages = await this.fetchUserPagesViaSdk();
    if (!pages.length) {
      this.logger.warn(
        'Meta OAuth completed but user has no manageable pages',
      );
    }

    const results: OAuthAccountResult[] = [];

    for (const page of pages) {
      // Facebook Page connection
      results.push({
        channel: ChannelEnum.facebook_page,
        accountId: page.id,
        accountHandle: page.name,
        accessToken: page.access_token, // page tokens no expiran si el usuario sigue siendo admin
        refreshToken: undefined,
        expiresAt: undefined,
        scopes: SCOPES,
        metadata: {
          pageId: page.id,
          pageName: page.name,
          category: page.category ?? null,
          categoryList: page.category_list ?? [],
          userAccessToken: longLived.accessToken,
          userTokenExpiresAt: longLived.expiresAt.toISOString(),
        },
      });

      // Instagram Business connection (si la page tiene IG linkado)
      if (page.instagram_business_account?.id) {
        const ig = page.instagram_business_account;
        results.push({
          channel: ChannelEnum.instagram,
          accountId: ig.id,
          accountHandle: ig.username ? `@${ig.username}` : ig.id,
          accessToken: page.access_token, // page token sirve para IG Graph API
          refreshToken: undefined,
          expiresAt: undefined,
          scopes: SCOPES,
          metadata: {
            igBusinessAccountId: ig.id,
            username: ig.username ?? null,
            profilePicUrl: ig.profile_picture_url ?? null,
            linkedFacebookPageId: page.id,
          },
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
    if (data['error']) {
      throw new Error(
        `Meta token exchange failed: ${JSON.stringify(data['error'])}`,
      );
    }
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
    if (data['error']) {
      throw new Error(
        `Meta long-lived token failed: ${JSON.stringify(data['error'])}`,
      );
    }
    const expiresIn = (data['expires_in'] as number) ?? 5183944;
    return {
      accessToken: data['access_token'] as string,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  }

  private async fetchUserPagesViaSdk(): Promise<PageData[]> {
    const me = new User('me');
    const fields = [
      'id',
      'name',
      'access_token',
      'category',
      'category_list',
      'instagram_business_account{id,username,profile_picture_url}',
    ];
    const cursor = await me.getAccounts(fields, { limit: 100 });

    // cursor is iterable; cada elemento es un Page wrapper con _data poblado
    const pages: PageData[] = [];
    for (const entry of cursor as unknown as Array<{
      _data?: PageData;
    }>) {
      const data = entry._data;
      if (data?.id) pages.push(data);
    }
    return pages;
  }
}
