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
import { splitWindows } from './date-windows';

const GRAPH_VERSION_DEFAULT = 'v25.0';

// Working Page insight metrics. NOTE: page_impressions / page_impressions_unique
// (reach) are gated behind App Review — apps without that approval get (#100).
// We map page_views_total → reach so the "Alcance" card/chart still populate with
// the closest available volume metric; true unique reach needs the read_insights
// page-impressions feature approved on the app.
const PAGE_METRIC_MAP: Record<string, string> = {
  page_views_total: MetricEnum.reach,
  page_post_engagements: MetricEnum.engagement,
  page_daily_follows: MetricEnum.new_follows,
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
  full_picture?: string;
  permalink_url?: string;
  likes?: { summary: { total_count: number } };
  comments?: { summary: { total_count: number } };
  shares?: { count: number };
  insights?: {
    data: Array<{ name: string; values: Array<{ value: unknown }> }>;
  };
}

@Injectable()
export class MetaFacebookPageProvider implements ChannelProvider {
  readonly channel = ChannelEnum.facebook_page;

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

    // Meta caps /insights ranges at 30 days, so request in <=30-day windows.
    const rows: MetricRow[] = [];
    for (const [since, until] of splitWindows(
      dateRange.from,
      dateRange.to,
      30,
    )) {
      const data = await this.fetchPageInsights(connection, since, until);
      for (const metricData of data) {
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
    }

    // Followers is a Page field (fan_count), not an insights metric in v25.
    try {
      const { data: page } = await axios.get<{ fan_count?: number }>(
        `${this.graphUrl}/${connection.accountId}?fields=fan_count&access_token=${encodeURIComponent(connection.accessToken)}`,
      );
      if (typeof page.fan_count === 'number') {
        rows.push({
          connectionId: connection.id,
          brandId: connection.brandId,
          date: dateRange.to,
          metric: MetricEnum.followers,
          value: page.fan_count,
        });
      }
    } catch {
      // non-fatal: followers is supplementary
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

    // Post-level insights via nested field expansion. If insights fail for a
    // page, retry without them so posts (and their basic counts) still load.
    // post_impressions(_unique) are gated by App Review on this app → skip them.
    const insightMetrics =
      'post_clicks,post_video_views,post_reactions_like_total';
    const baseFields =
      'id,message,created_time,full_picture,permalink_url,' +
      'likes.summary(true),comments.summary(true),shares';

    let data: { data?: PagePost[]; error?: unknown } | null = null;
    for (const fields of [
      `${baseFields},insights.metric(${insightMetrics})`,
      baseFields,
    ]) {
      const params = new URLSearchParams({
        fields,
        since: String(since),
        until: String(until),
        limit: '50',
        access_token: connection.accessToken,
      });
      try {
        const resp = await axios.get<{ data: PagePost[]; error?: unknown }>(
          `${this.graphUrl}/${connection.accountId}/posts?${params.toString()}`,
        );
        if (!resp.data.error) {
          data = resp.data;
          break;
        }
      } catch {
        // try without insights
      }
    }
    if (!data) {
      throw new Error(
        `Meta page posts: ${JSON.stringify((data as { error?: unknown } | null)?.error ?? 'request failed')}`,
      );
    }

    return (data.data ?? []).map((post) => {
      const ins: Record<string, number> = {};
      for (const m of post.insights?.data ?? []) {
        const v = m.values?.[0]?.value;
        if (typeof v === 'number') ins[m.name] = v;
      }
      const likes = post.likes?.summary?.total_count ?? 0;
      const comments = post.comments?.summary?.total_count ?? 0;
      const shares = post.shares?.count ?? 0;
      const reach = ins.post_impressions_unique ?? 0;
      return {
        brandId: connection.brandId,
        connectionId: connection.id,
        externalId: post.id,
        publishedAt: new Date(post.created_time),
        type: 'post',
        caption: post.message ?? null,
        mediaUrl: post.full_picture ?? null,
        metrics: {
          reach,
          likes,
          comments,
          shares,
          clicks: ins.post_clicks ?? 0,
          video_views: ins.post_video_views ?? 0,
          engagement: likes + comments + shares,
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
      throw new Error(`Meta token refresh: ${JSON.stringify(data['error'])}`);
    }
    const expiresIn = (data['expires_in'] as number) ?? 5183944;
    return {
      accessToken: data['access_token'] as string,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  }

  // Some Pages don't support every metric (e.g. page_daily_follows), and one
  // bad metric fails the whole call. Try the full set, then degrade to the
  // universally-valid core, so a connection never breaks over an optional one.
  private async fetchPageInsights(
    connection: Connection,
    since: number,
    until: number,
  ): Promise<PageInsightMetric[]> {
    const full = Object.keys(PAGE_METRIC_MAP).join(',');
    const core = 'page_views_total,page_post_engagements';
    for (const metric of [full, core]) {
      const params = new URLSearchParams({
        metric,
        period: 'day',
        since: String(since),
        until: String(until),
        access_token: connection.accessToken,
      });
      try {
        const { data } = await axios.get<{
          data: PageInsightMetric[];
          error?: unknown;
        }>(
          `${this.graphUrl}/${connection.accountId}/insights?${params.toString()}`,
        );
        if (!data.error) return data.data ?? [];
      } catch {
        // try the next (smaller) metric set
      }
    }
    return [];
  }

  private ensureConfigured(): void {
    if (!this.config.get<string>('META_APP_ID')) {
      throw new Error('Meta credentials not configured (META_APP_ID missing)');
    }
  }
}
