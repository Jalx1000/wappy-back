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
  // Needed to enumerate pages owned/managed via Business Managers (agency case);
  // /me/accounts alone only returns pages with a direct classic role.
  'business_management',
];

const PAGE_FIELDS =
  'id,name,access_token,category,category_list,instagram_business_account{id,username,profile_picture_url}';

interface PageData {
  id: string;
  name: string;
  // Absent on owned_pages/client_pages edges when the user has no direct task
  // on the page; resolved per-page via fetchPageToken().
  access_token?: string;
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
      // fetchUserPages only returns pages with a resolved token.
      if (!page.access_token) continue;
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
    // Debug: who is logged in + which permissions were granted.
    try {
      const { data: meData } = await axios.get<{ id: string; name?: string }>(
        `${this.graphUrl}/me?access_token=${encodeURIComponent(accessToken)}&fields=id,name`,
      );
      this.logger.log(
        `Meta OAuth: authenticated user → id=${meData.id} name=${meData.name ?? 'n/a'}`,
      );
    } catch (err) {
      this.logger.warn(`Failed to fetch /me: ${(err as Error).message}`);
    }

    let grantedBusinessMgmt = false;
    try {
      const { data: permsData } = await axios.get<{
        data: Array<{ permission: string; status: string }>;
      }>(
        `${this.graphUrl}/me/permissions?access_token=${encodeURIComponent(accessToken)}`,
      );
      const granted = permsData.data
        .filter((p) => p.status === 'granted')
        .map((p) => p.permission);
      grantedBusinessMgmt = granted.includes('business_management');
      this.logger.log(`Meta OAuth: granted=[${granted.join(',')}]`);
      if (!granted.includes('pages_show_list')) {
        this.logger.error(
          'Meta OAuth: user did NOT grant pages_show_list — page listing will be empty.',
        );
      }
      if (!grantedBusinessMgmt) {
        this.logger.warn(
          'Meta OAuth: business_management NOT granted — only pages with a direct ' +
            'classic role will be found (Business-Manager pages will be missing).',
        );
      }
    } catch (err) {
      this.logger.warn(
        `Failed to fetch /me/permissions: ${(err as Error).message}`,
      );
    }

    // Collect pages from every source, deduping by page id. A page may surface
    // from /me/accounts AND from a Business Manager; prefer whichever entry
    // already carries an access_token.
    const byId = new Map<string, PageData>();
    const add = (pages: PageData[], source: string) => {
      let added = 0;
      for (const p of pages) {
        if (!p?.id) continue;
        const prev = byId.get(p.id);
        if (!prev) {
          byId.set(p.id, p);
          added++;
        } else if (!prev.access_token && p.access_token) {
          byId.set(p.id, { ...prev, ...p });
        }
      }
      if (added) this.logger.log(`Meta OAuth: ${source} → +${added} pages`);
    };

    // 1) Pages with a direct classic role.
    add(
      await this.fetchAllPages(
        `${this.graphUrl}/me/accounts?fields=${PAGE_FIELDS}&limit=100&access_token=${encodeURIComponent(accessToken)}`,
        '/me/accounts',
      ),
      '/me/accounts',
    );

    // 2) Pages owned by / managed for the user's Business Managers.
    if (grantedBusinessMgmt) {
      const businesses = await this.fetchAllPages(
        `${this.graphUrl}/me/businesses?fields=id,name&limit=100&access_token=${encodeURIComponent(accessToken)}`,
        '/me/businesses',
      );
      for (const biz of businesses) {
        for (const edge of ['owned_pages', 'client_pages']) {
          // Lightweight fields only — the nested ig/token expansion across many
          // client pages makes the response huge and Facebook's proxy errors
          // out. Token + IG are resolved per-page below (fetchPageToken).
          add(
            await this.fetchAllPages(
              `${this.graphUrl}/${biz.id}/${edge}?fields=id,name&limit=50&access_token=${encodeURIComponent(accessToken)}`,
              `business ${biz.name ?? biz.id}/${edge}`,
            ),
            `business ${biz.name ?? biz.id}/${edge}`,
          );
        }
      }
    }

    // 3) Some Business-Manager pages come back without an access_token on the
    // edge. Fetch a page token per-page (works when the user has a task on it).
    const pages: PageData[] = [];
    for (const page of byId.values()) {
      let resolved = page;
      if (!resolved.access_token) {
        const fetched = await this.fetchPageToken(page.id, accessToken);
        if (fetched) resolved = { ...page, ...fetched };
      }
      if (resolved.access_token) {
        pages.push(resolved);
      } else {
        this.logger.warn(
          `Meta OAuth: page ${page.id}:${page.name} has no obtainable token — skipped`,
        );
      }
    }

    this.logger.log(
      `Meta OAuth: total ${pages.length} pages → [${pages
        .map((p) => p.name)
        .join(', ')}]`,
    );
    return pages;
  }

  // Follows paging.next across all result pages of an edge. Errors are logged
  // and treated as "no more results" so one failing edge never aborts the rest.
  private async fetchAllPages(
    startUrl: string,
    label: string,
  ): Promise<PageData[]> {
    const out: PageData[] = [];
    let url: string | null = startUrl;
    while (url) {
      let data: {
        data?: PageData[];
        paging?: { next?: string };
        error?: { message: string; code: number };
      };
      try {
        ({ data } = await axios.get(url));
      } catch (err) {
        // Network/proxy error on one edge must not abort the whole OAuth —
        // keep whatever pages were already collected from other edges.
        this.logger.warn(
          `Meta OAuth: ${label} request failed → ${(err as Error).message}`,
        );
        break;
      }
      if (data.error) {
        this.logger.warn(
          `Meta OAuth: ${label} error → ${JSON.stringify(data.error)}`,
        );
        break;
      }
      out.push(...(data.data ?? []));
      url = data.paging?.next ?? null;
    }
    return out;
  }

  private async fetchPageToken(
    pageId: string,
    userToken: string,
  ): Promise<PageData | null> {
    try {
      const { data } = await axios.get<PageData & { error?: unknown }>(
        `${this.graphUrl}/${pageId}?fields=${PAGE_FIELDS}&access_token=${encodeURIComponent(userToken)}`,
      );
      if (data.error || !data.access_token) return null;
      return data;
    } catch {
      return null;
    }
  }
}
