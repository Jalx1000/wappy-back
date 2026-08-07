import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ChannelEnum } from '../../../connections/domain/channel.enum';
import {
  ChannelOAuthService,
  OAuthAccountResult,
} from '../../../oauth/oauth-provider.interface';

const TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const USER_INFO_URL = 'https://open.tiktokapis.com/v2/user/info/';

// Default to scopes that don't require Content Posting approval. TikTok rejects
// the whole login if ANY requested scope isn't enabled/approved for the app, so
// publishing scopes (video.upload/video.publish) must be added via TIKTOK_SCOPES
// only once the app is approved for the Content Posting API.
const DEFAULT_TIKTOK_SCOPES =
  'user.info.basic,user.info.profile,user.info.stats,video.list';

@Injectable()
export class TiktokOAuthService implements ChannelOAuthService {
  readonly urlChannel = 'tiktok';

  constructor(private readonly config: ConfigService) {}

  private get scopes(): string {
    return this.config.get<string>('TIKTOK_SCOPES') ?? DEFAULT_TIKTOK_SCOPES;
  }

  getAuthorizationUrl(state: string): string {
    const clientKey = this.config.getOrThrow<string>('TIKTOK_CLIENT_KEY');
    const redirectUri = this.config.getOrThrow<string>('TIKTOK_REDIRECT_URI');
    const params = new URLSearchParams({
      client_key: clientKey,
      redirect_uri: redirectUri,
      scope: this.scopes,
      state,
      response_type: 'code',
    });
    return `https://www.tiktok.com/v2/auth/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<OAuthAccountResult[]> {
    const clientKey = this.config.getOrThrow<string>('TIKTOK_CLIENT_KEY');
    const clientSecret = this.config.getOrThrow<string>('TIKTOK_CLIENT_SECRET');
    const redirectUri = this.config.getOrThrow<string>('TIKTOK_REDIRECT_URI');

    const { data: tokenData } = await axios.post<Record<string, unknown>>(
      TOKEN_URL,
      new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    if (tokenData['error']) {
      throw new Error(
        `TikTok token exchange: ${(tokenData['error_description'] as string) ?? String(tokenData['error'])}`,
      );
    }

    const accessToken = tokenData['access_token'] as string;
    const refreshToken = tokenData['refresh_token'] as string | undefined;
    const expiresIn = tokenData['expires_in'] as number;
    const openId = tokenData['open_id'] as string;

    const { data: userData } = await axios.get<Record<string, unknown>>(
      `${USER_INFO_URL}?fields=open_id,union_id,display_name,avatar_url,username`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const user =
      ((userData['data'] as Record<string, unknown>)?.['user'] as Record<
        string,
        unknown
      >) ?? {};

    return [
      {
        channel: ChannelEnum.tiktok,
        accountId: openId ?? (user['open_id'] as string),
        accountHandle:
          (user['username'] as string) ??
          (user['display_name'] as string) ??
          openId,
        accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
        scopes: this.scopes.split(',').map((s) => s.trim()),
        metadata: {
          openId,
          unionId: user['union_id'],
          username: user['username'],
          displayName: user['display_name'],
          avatarUrl: user['avatar_url'],
        },
      },
    ];
  }
}
