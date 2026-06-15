import { ChannelEnum } from '../../domain/channel.enum';

export class OrphanAccount {
  id: number;
  channel: ChannelEnum;
  accountId: string;
  accountHandle: string;
  accessToken: string; // encrypted at rest
  refreshToken: string | null; // encrypted at rest
  expiresAt: Date | null;
  scopes: string[];
  metadata: Record<string, unknown>;
  discoveredByUserId: number;
  discoveredAt: Date;
}
