import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ChannelEnum } from '../../../connections/domain/channel.enum';
import { Connection } from '../../../connections/domain/connection';
import { MetricEnum } from '../../../metrics/domain/metric.enum';
import {
  ChannelProvider,
  DateRange,
  MetricRow,
  PostData,
  TokenData,
} from '../../channel-provider.interface';

const GRAPH_VERSION_DEFAULT = 'v25.0';
const REFRESH_URL = 'https://graph.instagram.com/refresh_access_token';

const METRIC_MAP: Record<string, string> = {
  reach: MetricEnum.reach,
  impressions: MetricEnum.impressions,
  accounts_engaged: MetricEnum.engagement,
};

interface InsightValue {
  value: number;
  end_time?: string;
}

interface InsightMetric {
  name: string;
  values?: InsightValue[];
  total_value?: { value: number };
  period?: string;
}

interface MediaItem {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
}

@Injectable()
export class InstagramLoginProvider implements ChannelProvider {
  readonly channel = ChannelEnum.instagram_login;
  private readonly logger = new Logger(InstagramLoginProvider.name);

  constructor(private readonly config: ConfigService) {}

  private get graphUrl(): string {
    const v = this.config.get<string>(
      'META_GRAPH_VERSION',
      GRAPH_VERSION_DEFAULT,
    );
    return `https://graph.instagram.com/${v}`;
  }

  async fetchMetrics(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<MetricRow[]> {
    const since = Math.floor(dateRange.from.getTime() / 1000);
    const until = Math.floor(dateRange.to.getTime() / 1000);

    const params = new URLSearchParams({
      metric: 'reach,accounts_engaged',
      period: 'day',
      metric_type: 'total_value',
      since: String(since),
      until: String(until),
      access_token: connection.accessToken,
    });

    const rows: MetricRow[] = [];
    try {
      const { data } = await axios.get<{ data?: InsightMetric[] }>(
        `${this.graphUrl}/${connection.accountId}/insights?${params.toString()}`,
      );
      for (const metric of data.data ?? []) {
        const mapped = METRIC_MAP[metric.name];
        if (!mapped) continue;
        const value =
          metric.total_value?.value ??
          (metric.values && metric.values[0]?.value) ??
          0;
        rows.push({
          connectionId: connection.id,
          brandId: connection.brandId,
          date: dateRange.to,
          metric: mapped,
          value,
        });
      }
    } catch (err) {
      this.logger.warn(`IG Login insights: ${(err as Error).message}`);
    }

    // followers_count (current snapshot)
    try {
      const profileParams = new URLSearchParams({
        fields: 'followers_count,follows_count,media_count',
        access_token: connection.accessToken,
      });
      const { data: profile } = await axios.get<{
        followers_count?: number;
      }>(
        `${this.graphUrl}/${connection.accountId}?${profileParams.toString()}`,
      );
      if (profile.followers_count !== undefined) {
        rows.push({
          connectionId: connection.id,
          brandId: connection.brandId,
          date: dateRange.to,
          metric: MetricEnum.followers,
          value: profile.followers_count,
        });
      }
    } catch (err) {
      this.logger.warn(`IG Login profile: ${(err as Error).message}`);
    }

    return rows;
  }

  async fetchPosts(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<PostData[]> {
    const since = Math.floor(dateRange.from.getTime() / 1000);
    const until = Math.floor(dateRange.to.getTime() / 1000);

    const params = new URLSearchParams({
      fields:
        'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
      since: String(since),
      until: String(until),
      access_token: connection.accessToken,
      limit: '50',
    });

    try {
      const { data } = await axios.get<{ data?: MediaItem[] }>(
        `${this.graphUrl}/${connection.accountId}/media?${params.toString()}`,
      );
      return (data.data ?? []).map((post) => ({
        brandId: connection.brandId,
        connectionId: connection.id,
        externalId: post.id,
        publishedAt: new Date(post.timestamp),
        type: (post.media_type ?? 'IMAGE').toLowerCase(),
        caption: post.caption ?? null,
        // Prefer the thumbnail so VIDEO/REEL posts render in an <img>; media_url
        // for videos is the playable file, not an image.
        mediaUrl: post.thumbnail_url ?? post.media_url ?? null,
        metrics: {
          likes: post.like_count ?? 0,
          comments: post.comments_count ?? 0,
        },
      }));
    } catch (err) {
      this.logger.warn(`IG Login media: ${(err as Error).message}`);
      return [];
    }
  }

  async refreshToken(connection: Connection): Promise<TokenData> {
    const params = new URLSearchParams({
      grant_type: 'ig_refresh_token',
      access_token: connection.accessToken,
    });
    const { data } = await axios.get<{
      access_token: string;
      token_type: string;
      expires_in: number;
    }>(`${REFRESH_URL}?${params.toString()}`);
    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }
}
