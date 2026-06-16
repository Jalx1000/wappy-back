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
  total_interactions: MetricEnum.total_interactions,
  likes: MetricEnum.likes,
  comments: MetricEnum.comments,
  shares: MetricEnum.shares,
  saves: MetricEnum.saves,
  profile_views: MetricEnum.profile_views,
  website_clicks: MetricEnum.website_clicks,
};

const IG_ACCOUNT_METRICS = Object.keys(IG_METRIC_MAP).join(',');

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
  insights?: {
    data: Array<{ name: string; values: Array<{ value: number }> }>;
  };
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

    const rows: MetricRow[] = [];

    // Daily reach (period=day, no metric_type) → real daily series for charts.
    try {
      const dailyParams = new URLSearchParams({
        metric: 'reach',
        period: 'day',
        since: String(since),
        until: String(until),
        access_token: connection.accessToken,
      });
      const { data: daily } = await axios.get<{
        data: Array<{
          name: string;
          values: { value: number; end_time: string }[];
        }>;
      }>(
        `${this.graphUrl}/${connection.accountId}/insights?${dailyParams.toString()}`,
      );
      for (const point of daily.data?.[0]?.values ?? []) {
        rows.push({
          connectionId: connection.id,
          brandId: connection.brandId,
          date: new Date(point.end_time),
          metric: MetricEnum.reach,
          value: point.value,
        });
      }
    } catch {
      // non-fatal: aggregates below still cover the KPIs
    }

    // Aggregate metrics for the window (total_value), dated at window end.
    const params = new URLSearchParams({
      metric: IG_ACCOUNT_METRICS,
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

    for (const metricData of data.data ?? []) {
      const metricName = IG_METRIC_MAP[metricData.name];
      if (!metricName || metricData.total_value?.value === undefined) continue;
      // reach already stored as a daily series above.
      if (metricName === MetricEnum.reach) continue;
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
      fields:
        'id,caption,media_type,timestamp,like_count,comments_count,' +
        'insights.metric(reach,total_interactions,saved,views)',
      since: String(since),
      until: String(until),
      limit: '50',
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

    return (data.data ?? []).map((post) => {
      const ins: Record<string, number> = {};
      for (const m of post.insights?.data ?? []) {
        const v = m.values?.[0]?.value;
        if (typeof v === 'number') ins[m.name] = v;
      }
      const likes = post.like_count ?? 0;
      const comments = post.comments_count ?? 0;
      return {
        brandId: connection.brandId,
        connectionId: connection.id,
        externalId: post.id,
        publishedAt: new Date(post.timestamp),
        type: (post.media_type ?? 'IMAGE').toLowerCase(),
        caption: post.caption ?? null,
        mediaUrl: null,
        metrics: {
          reach: ins.reach ?? 0,
          likes,
          comments,
          saves: ins.saved ?? 0,
          video_views: ins.views ?? 0,
          engagement: ins.total_interactions ?? likes + comments,
        },
      };
    });
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
