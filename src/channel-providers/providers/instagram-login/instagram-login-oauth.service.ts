import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ChannelEnum } from '../../../connections/domain/channel.enum';
import {
  ChannelOAuthService,
  OAuthAccountResult,
} from '../../../oauth/oauth-provider.interface';

const AUTH_URL = 'https://www.instagram.com/oauth/authorize';
const TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const LONG_LIVED_URL = 'https://graph.instagram.com/access_token';
const ME_URL = 'https://graph.instagram.com/v25.0/me';

const SCOPES = [
  'instagram_business_basic',
  'instagram_business_manage_insights',
  'instagram_business_content_publish',
  'instagram_business_manage_messages',
  'instagram_business_manage_comments',
];

interface ShortLivedTokenResponse {
  access_token: string;
  user_id: number | string;
  permissions: string[];
}

interface LongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface MeResponse {
  user_id?: string;
  id?: string;
  username?: string;
  account_type?: string;
  profile_picture_url?: string;
  name?: string;
}

@Injectable()
export class InstagramLoginOAuthService implements ChannelOAuthService {
  readonly urlChannel = 'instagram-login';
  private readonly logger = new Logger(InstagramLoginOAuthService.name);

  constructor(private readonly config: ConfigService) {}

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.getOrThrow<string>('INSTAGRAM_LOGIN_APP_ID'),
      redirect_uri: this.config.getOrThrow<string>(
        'INSTAGRAM_LOGIN_REDIRECT_URI',
      ),
      scope: SCOPES.join(','),
      state,
      response_type: 'code',
    });
    return `${AUTH_URL}?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<OAuthAccountResult[]> {
    const appId = this.config.getOrThrow<string>('INSTAGRAM_LOGIN_APP_ID');
    const appSecret = this.config.getOrThrow<string>(
      'INSTAGRAM_LOGIN_APP_SECRET',
    );
    const redirectUri = this.config.getOrThrow<string>(
      'INSTAGRAM_LOGIN_REDIRECT_URI',
    );

    // Step 1: code → short-lived token
    const formData = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    });

    const { data: shortLived } = await axios.post<ShortLivedTokenResponse>(
      TOKEN_URL,
      formData.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    this.logger.log(
      `IG Login: short-lived token OK, user_id=${shortLived.user_id} permissions=${shortLived.permissions?.join(',') ?? 'n/a'}`,
    );

    // Step 2: short-lived → long-lived (~60 days)
    const longParams = new URLSearchParams({
      grant_type: 'ig_exchange_token',
      client_secret: appSecret,
      access_token: shortLived.access_token,
    });

    const { data: longLived } = await axios.get<LongLivedTokenResponse>(
      `${LONG_LIVED_URL}?${longParams.toString()}`,
    );

    this.logger.log(
      `IG Login: long-lived token OK, expires_in=${longLived.expires_in}s`,
    );

    // Step 3: get user profile (username, account_type)
    const meParams = new URLSearchParams({
      fields: 'user_id,username,account_type,profile_picture_url,name',
      access_token: longLived.access_token,
    });
    const { data: me } = await axios.get<MeResponse>(
      `${ME_URL}?${meParams.toString()}`,
    );

    const accountId = String(me.user_id ?? me.id ?? shortLived.user_id);
    const username = me.username ?? '';

    return [
      {
        channel: ChannelEnum.instagram_login,
        accountId,
        accountHandle: username ? `@${username}` : accountId,
        accessToken: longLived.access_token,
        refreshToken: undefined,
        expiresAt: new Date(Date.now() + longLived.expires_in * 1000),
        scopes: SCOPES,
        metadata: {
          igUserId: accountId,
          username,
          accountType: me.account_type ?? null,
          profilePicUrl: me.profile_picture_url ?? null,
          displayName: me.name ?? null,
        },
      },
    ];
  }
}
