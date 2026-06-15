import { ChannelEnum } from '../../../connections/domain/channel.enum';

export interface OAuthDiscoveryAccount {
  channel: ChannelEnum;
  accountId: string;
  accountHandle: string;
  accessToken: string; // encrypted at rest
  refreshToken?: string; // encrypted at rest
  expiresAt?: string; // ISO
  scopes: string[];
  metadata: Record<string, unknown>;
}

export class OAuthDiscovery {
  id: number;
  userId: number;
  channel: string;
  triggeredBrandId: number | null;
  accounts: OAuthDiscoveryAccount[];
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
}
