import { Injectable } from '@nestjs/common';
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

// v25: IG `impressions` was removed in favour of `views`; account-level
// insights now require metric_type=total_value.
const IG_METRIC_MAP: Record<string, string> = {
  reach: MetricEnum.reach,
  views: MetricEnum.impressions,
  accounts_engaged: MetricEnum.engagement,
};

interface IgInsightMetric {
  name: string;
  total_value?: { value: number };
}

interface IgMediaItem {
  id: string;
  caption?: string;
  media_type?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
}

@Injectable()
export class MetaInstagramProvider implements ChannelProvider {
  readonly channel = ChannelEnum.instagram;

  constructor(private readonly config: ConfigService) {}

  private get graphUrl(): string {
    const v = this.config.get<string>(
      'META_GRAPH_VERSION',
      GRAPH_VERSION_DEFAULT,
    );
    return `https://graph.facebook.com/${v}`;
  }

  async fetchMetrics(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<MetricRow[]> {
    this.ensureConfigured();
    const since = Math.floor(dateRange.from.getTime() / 1000);
    const until = Math.floor(dateRange.to.getTime() / 1000);

    const params = new URLSearchParams({
      metric: 'reach,views,accounts_engaged',
      period: 'day',
      metric_type: 'total_value',
      since: String(since),
      until: String(until),
      access_token: connection.accessToken,
    });

    const { data } = await axios.get<{ data: IgInsightMetric[] }>(
      `${this.graphUrl}/${connection.accountId}/insights?${params.toString()}`,
    );
    if ((data as Record<string, unknown>)['error']) {
      throw new Error(
        `IG insights: ${JSON.stringify((data as Record<string, unknown>)['error'])}`,
      );
    }

    // total_value returns one aggregate per metric for the window; store it
    // dated at the window end.
    const rows: MetricRow[] = [];
    for (const metricData of data.data ?? []) {
      const metricName = IG_METRIC_MAP[metricData.name];
      if (!metricName || metricData.total_value?.value === undefined) continue;
      rows.push({
        connectionId: connection.id,
        brandId: connection.brandId,
        date: dateRange.to,
        metric: metricName,
        value: metricData.total_value.value,
      });
    }

    const profileParams = new URLSearchParams({
      fields: 'followers_count',
      access_token: connection.accessToken,
    });
    const { data: profile } = await axios.get<{ followers_count?: number }>(
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

    return rows;
  }

  async fetchPosts(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<PostData[]> {
    this.ensureConfigured();
    const since = Math.floor(dateRange.from.getTime() / 1000);
    const until = Math.floor(dateRange.to.getTime() / 1000);

    const params = new URLSearchParams({
      fields: 'id,caption,media_type,timestamp,like_count,comments_count',
      since: String(since),
      until: String(until),
      access_token: connection.accessToken,
    });

    const { data } = await axios.get<{ data: IgMediaItem[] }>(
      `${this.graphUrl}/${connection.accountId}/media?${params.toString()}`,
    );
    if ((data as Record<string, unknown>)['error']) {
      throw new Error(
        `IG media: ${JSON.stringify((data as Record<string, unknown>)['error'])}`,
      );
    }

    return (data.data ?? []).map((post) => ({
      brandId: connection.brandId,
      connectionId: connection.id,
      externalId: post.id,
      publishedAt: new Date(post.timestamp),
      type: (post.media_type ?? 'IMAGE').toLowerCase(),
      caption: post.caption ?? null,
      mediaUrl: null,
      metrics: {
        likes: post.like_count ?? 0,
        comments: post.comments_count ?? 0,
      },
    }));
  }

  async refreshToken(connection: Connection): Promise<TokenData> {
    this.ensureConfigured();
    const appId = this.config.getOrThrow<string>('META_APP_ID');
    const appSecret = this.config.getOrThrow<string>('META_APP_SECRET');

    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: connection.accessToken,
    });
    const { data } = await axios.get<Record<string, unknown>>(
      `${this.graphUrl}/oauth/access_token?${params.toString()}`,
    );
    if (data['error']) {
      throw new Error(`IG token refresh: ${JSON.stringify(data['error'])}`);
    }
    const expiresIn = (data['expires_in'] as number) ?? 5183944;
    return {
      accessToken: data['access_token'] as string,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  }

  private ensureConfigured(): void {
    if (!this.config.get<string>('META_APP_ID')) {
      throw new Error('Meta credentials not configured (META_APP_ID missing)');
    }
  }
}
