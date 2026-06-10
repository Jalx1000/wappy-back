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

const GRAPH_URL = 'https://graph.facebook.com/v19.0';

const PAGE_METRIC_MAP: Record<string, string> = {
  page_fan_count: MetricEnum.followers,
  page_impressions: MetricEnum.impressions,
  page_reach: MetricEnum.reach,
  page_post_engagements: MetricEnum.engagement,
};

interface PageInsightValue {
  value: number;
  end_time: string;
}

interface PageInsightMetric {
  name: string;
  values: PageInsightValue[];
}

interface PagePost {
  id: string;
  message?: string;
  created_time: string;
  likes?: { summary: { total_count: number } };
  comments?: { summary: { total_count: number } };
  shares?: { count: number };
}

@Injectable()
export class MetaFacebookPageProvider implements ChannelProvider {
  readonly channel = ChannelEnum.facebook_page;

  constructor(private readonly config: ConfigService) {}

  async fetchMetrics(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<MetricRow[]> {
    this.ensureConfigured();
    const since = Math.floor(dateRange.from.getTime() / 1000);
    const until = Math.floor(dateRange.to.getTime() / 1000);

    const params = new URLSearchParams({
      metric: Object.keys(PAGE_METRIC_MAP).join(','),
      period: 'day',
      since: String(since),
      until: String(until),
      access_token: connection.accessToken,
    });

    const { data } = await axios.get<{ data: PageInsightMetric[] }>(
      `${GRAPH_URL}/${connection.accountId}/insights?${params.toString()}`,
    );
    if ((data as Record<string, unknown>)['error']) {
      throw new Error(`Meta page insights: ${JSON.stringify((data as Record<string, unknown>)['error'])}`);
    }

    const rows: MetricRow[] = [];
    for (const metricData of data.data ?? []) {
      const metricName = PAGE_METRIC_MAP[metricData.name];
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
      fields: 'id,message,created_time,likes.summary(true),comments.summary(true),shares',
      since: String(since),
      until: String(until),
      access_token: connection.accessToken,
    });

    const { data } = await axios.get<{ data: PagePost[] }>(
      `${GRAPH_URL}/${connection.accountId}/posts?${params.toString()}`,
    );
    if ((data as Record<string, unknown>)['error']) {
      throw new Error(`Meta page posts: ${JSON.stringify((data as Record<string, unknown>)['error'])}`);
    }

    return (data.data ?? []).map((post) => ({
      brandId: connection.brandId,
      connectionId: connection.id,
      externalId: post.id,
      publishedAt: new Date(post.created_time),
      type: 'post',
      caption: post.message ?? null,
      mediaUrl: null,
      metrics: {
        likes: post.likes?.summary?.total_count ?? 0,
        comments: post.comments?.summary?.total_count ?? 0,
        shares: post.shares?.count ?? 0,
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
      `${GRAPH_URL}/oauth/access_token?${params.toString()}`,
    );
    if (data['error']) {
      throw new Error(`Meta token refresh: ${JSON.stringify(data['error'])}`);
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
