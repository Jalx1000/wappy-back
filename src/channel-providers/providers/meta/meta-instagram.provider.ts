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

const IG_METRIC_MAP: Record<string, string> = {
  reach: MetricEnum.reach,
  impressions: MetricEnum.impressions,
  accounts_engaged: MetricEnum.engagement,
};

interface IgInsightValue {
  value: number;
  end_time: string;
}

interface IgInsightMetric {
  name: string;
  values: IgInsightValue[];
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
      metric: 'reach,impressions,accounts_engaged',
      period: 'day',
      since: String(since),
      until: String(until),
      access_token: connection.accessToken,
    });

    const { data } = await axios.get<{ data: IgInsightMetric[] }>(
      `${this.graphUrl}/${connection.accountId}/insights?${params.toString()}`,
    );
    if ((data as Record<string, unknown>)['error']) {
      throw new Error(`IG insights: ${JSON.stringify((data as Record<string, unknown>)['error'])}`);
    }

    const rows: MetricRow[] = [];
    for (const metricData of data.data ?? []) {
      const metricName = IG_METRIC_MAP[metricData.name];
      if (!metricName) continue;
      for (const point of metricData.values ?? []) {
        rows.push({
          connectionId: connection.id,
          brandId: connection.brandId,
          date: new Date(point.end_time),
          metric: metricName,
          value: point.value,
        });
      }
    }

    const profileParams = new URLSearchParams({
      fields: 'followers_count',
      access_token: connection.accessToken,
    });
    const { data: profile } = await axios.get<{ followers_count?: number }>(
      `${this.graphUrl}/${connection.accountId}?${profileParams.toString()}`,
    );
    if (profile.followers_count !== undefined && rows.length > 0) {
      const latestDate = rows.reduce((d, r) => (r.date > d ? r.date : d), rows[0].date);
      rows.push({
        connectionId: connection.id,
        brandId: connection.brandId,
        date: latestDate,
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
      throw new Error(`IG media: ${JSON.stringify((data as Record<string, unknown>)['error'])}`);
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
