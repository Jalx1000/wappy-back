import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ChannelEnum } from '../../../connections/domain/channel.enum';
import {
  ChannelOAuthService,
  OAuthAccountResult,
} from '../../../oauth/oauth-provider.interface';

const GRAPH_VERSION_DEFAULT = 'v25.0';

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

  private get graphVersion(): string {
    return this.config.get<string>('META_GRAPH_VERSION', GRAPH_VERSION_DEFAULT);
  }

  private get graphUrl(): string {
    return `https://graph.facebook.com/${this.graphVersion}`;
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.getOrThrow<string>('META_APP_ID'),
      redirect_uri: this.config.getOrThrow<string>('META_REDIRECT_URI'),
      scope: SCOPES.join(','),
      state,
      response_type: 'code',
    });
    return `https://www.facebook.com/${this.graphVersion}/dialog/oauth?${params.toString()}`;
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

    // 3) Listar pages del usuario via Graph API directo (más confiable y
    // debugueable que el SDK; además permite loggear granted permissions).
    const pages = await this.fetchUserPages(longLived.accessToken);
    if (!pages.length) {
      this.logger.warn(
        'Meta OAuth completed but user has no manageable pages. ' +
          'Ver logs anteriores para granted permissions y respuesta de /me/accounts.',
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
      `${this.graphUrl}/oauth/access_token?${params.toString()}`,
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
      `${this.graphUrl}/oauth/access_token?${params.toString()}`,
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

  private async fetchUserPages(accessToken: string): Promise<PageData[]> {
    const fields = [
      'id',
      'name',
      'access_token',
      'category',
      'category_list',
      'instagram_business_account{id,username,profile_picture_url}',
    ].join(',');

    const params = new URLSearchParams({
      access_token: accessToken,
      fields,
      limit: '100',
    });

    // 1) Primero verificar quién es el usuario logueado (debug útil)
    try {
      const { data: meData } = await axios.get<{
        id: string;
        name?: string;
        email?: string;
      }>(`${this.graphUrl}/me?access_token=${encodeURIComponent(accessToken)}&fields=id,name,email`);
      this.logger.log(
        `Meta OAuth: authenticated user → id=${meData.id} name=${meData.name ?? 'n/a'}`,
      );
    } catch (err) {
      this.logger.warn(`Failed to fetch /me: ${(err as Error).message}`);
    }

    // 2) Verificar qué permisos otorgó el usuario (clave para diagnosticar)
    try {
      const { data: permsData } = await axios.get<{
        data: Array<{ permission: string; status: string }>;
      }>(`${this.graphUrl}/me/permissions?access_token=${encodeURIComponent(accessToken)}`);
      const granted = permsData.data
        .filter((p) => p.status === 'granted')
        .map((p) => p.permission);
      const declined = permsData.data
        .filter((p) => p.status === 'declined')
        .map((p) => p.permission);
      this.logger.log(
        `Meta OAuth: granted=[${granted.join(',')}] declined=[${declined.join(',')}]`,
      );
      // Si pages_show_list no está granted, el /me/accounts SIEMPRE devolverá vacío.
      if (!granted.includes('pages_show_list')) {
        this.logger.error(
          'Meta OAuth: user did NOT grant pages_show_list — /me/accounts will return empty. ' +
            'Probable causa: usuario no aceptó ese permission en el consent dialog.',
        );
      }
    } catch (err) {
      this.logger.warn(`Failed to fetch /me/permissions: ${(err as Error).message}`);
    }

    // 3) Llamada real para listar pages
    const url = `${this.graphUrl}/me/accounts?${params.toString()}`;
    const { data } = await axios.get<{
      data?: PageData[];
      paging?: unknown;
      error?: { message: string; type: string; code: number };
    }>(url);

    if (data.error) {
      this.logger.error(
        `Meta OAuth: /me/accounts returned error → ${JSON.stringify(data.error)}`,
      );
      throw new Error(`Meta /me/accounts failed: ${data.error.message}`);
    }

    const pages = data.data ?? [];
    this.logger.log(
      `Meta OAuth: /me/accounts returned ${pages.length} pages → [${pages
        .map((p) => `${p.id}:${p.name}`)
        .join(', ')}]`,
    );

    return pages;
  }
}
