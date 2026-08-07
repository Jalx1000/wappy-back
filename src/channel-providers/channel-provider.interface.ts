import { ChannelEnum } from '../connections/domain/channel.enum';
import { Connection } from '../connections/domain/connection';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface MetricRow {
  connectionId: number;
  brandId: number;
  date: Date;
  metric: string;
  value: number;
}

export interface PostData {
  brandId: number;
  connectionId: number;
  externalId: string;
  publishedAt: Date;
  type: string;
  caption: string | null;
  mediaUrl: string | null;
  metrics: Record<string, number>;
}

export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface ChannelProvider {
  channel: ChannelEnum;
  fetchMetrics(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<MetricRow[]>;
  fetchPosts(connection: Connection, dateRange: DateRange): Promise<PostData[]>;
  refreshToken(connection: Connection): Promise<TokenData>;
}
