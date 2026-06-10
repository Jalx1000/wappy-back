import { ChannelEnum } from '../connections/domain/channel.enum';

export const OAUTH_SERVICES = 'OAUTH_SERVICES';

export interface OAuthAccountResult {
  channel: ChannelEnum;
  accountId: string;
  accountHandle: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes: string[];
  metadata: Record<string, unknown>;
}

export interface ChannelOAuthService {
  readonly urlChannel: string;
  getAuthorizationUrl(state: string): string;
  exchangeCode(code: string): Promise<OAuthAccountResult[]>;
}
