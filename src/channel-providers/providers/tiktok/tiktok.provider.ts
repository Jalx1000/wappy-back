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

const VIDEO_LIST_URL = 'https://open.tiktokapis.com/v2/video/list/';
const VIDEO_QUERY_URL = 'https://open.tiktokapis.com/v2/video/query/';
const USER_INFO_URL = 'https://open.tiktokapis.com/v2/user/info/';
const TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';

interface TiktokVideo {
  id: string;
  create_time: number;
  title: string | null;
  cover_image_url: string | null;
}

interface TiktokVideoMetrics {
  id: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
}

interface TiktokProfileStats {
  follower_count?: number;
  following_count?: number;
  likes_count?: number;
  video_count?: number;
}

// TikTok's video/list returns newest-first in pages of up to 20.
const VIDEO_PAGE_SIZE = 20;
// video/query accepts at most 20 ids per request.
const VIDEO_QUERY_CHUNK = 20;
const MAX_VIDEO_PAGES = 50;

@Injectable()
export class TiktokProvider implements ChannelProvider {
  readonly channel = ChannelEnum.tiktok;
  private readonly logger = new Logger(TiktokProvider.name);

  constructor(private readonly config: ConfigService) {}

  async fetchMetrics(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<MetricRow[]> {
    this.ensureConfigured();
    const rows: MetricRow[] = [];

    const videos = await this.listVideos(connection.accessToken, dateRange);
    if (videos.length > 0) {
      const videoIds = videos.map((v) => v.id);
      const metrics = await this.queryVideoMetrics(
        connection.accessToken,
        videoIds,
      );

      const daily = new Map<
        string,
        { likes: number; comments: number; shares: number; views: number }
      >();

      for (const video of videos) {
        const dateKey = new Date(video.create_time * 1000)
          .toISOString()
          .split('T')[0];
        const m = metrics.find((x) => x.id === video.id);
        if (!m) continue;
        const existing = daily.get(dateKey) ?? {
          likes: 0,
          comments: 0,
          shares: 0,
          views: 0,
        };
        existing.likes += m.like_count;
        existing.comments += m.comment_count;
        existing.shares += m.share_count;
        existing.views += m.view_count;
        daily.set(dateKey, existing);
      }

      for (const [dateStr, agg] of daily) {
        const date = new Date(dateStr);
        rows.push(
          {
            connectionId: connection.id,
            brandId: connection.brandId,
            date,
            metric: MetricEnum.likes,
            value: agg.likes,
          },
          {
            connectionId: connection.id,
            brandId: connection.brandId,
            date,
            metric: MetricEnum.comments,
            value: agg.comments,
          },
          {
            connectionId: connection.id,
            brandId: connection.brandId,
            date,
            metric: MetricEnum.shares,
            value: agg.shares,
          },
          {
            connectionId: connection.id,
            brandId: connection.brandId,
            date,
            metric: MetricEnum.impressions,
            value: agg.views,
          },
          {
            connectionId: connection.id,
            brandId: connection.brandId,
            date,
            metric: MetricEnum.engagement,
            value: agg.likes + agg.comments + agg.shares,
          },
        );
      }
    }

    // Profile-level totals (followers / following / cumulative likes / video
    // count) as of today. Dated to dateRange.to so the daily cron leaves one
    // row per day, enabling arbitrary date-range comparisons (e.g. 2-year
    // follower growth). Non-fatal: a stats failure must not drop video metrics.
    try {
      const stats = await this.fetchProfileStats(connection.accessToken);
      if (stats) {
        const date = dateRange.to;
        const base = {
          connectionId: connection.id,
          brandId: connection.brandId,
          date,
        };
        if (stats.follower_count !== undefined)
          rows.push({
            ...base,
            metric: MetricEnum.followers,
            value: stats.follower_count,
          });
        if (stats.following_count !== undefined)
          rows.push({
            ...base,
            metric: MetricEnum.following,
            value: stats.following_count,
          });
        if (stats.likes_count !== undefined)
          rows.push({
            ...base,
            metric: MetricEnum.total_likes,
            value: stats.likes_count,
          });
        if (stats.video_count !== undefined)
          rows.push({
            ...base,
            metric: MetricEnum.video_count,
            value: stats.video_count,
          });
      }
    } catch (err) {
      this.logger.warn(`TikTok profile stats: ${(err as Error).message}`);
    }

    return rows;
  }

  async fetchPosts(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<PostData[]> {
    this.ensureConfigured();
    const videos = await this.listVideos(connection.accessToken, dateRange);
    if (videos.length === 0) return [];

    const videoIds = videos.map((v) => v.id);
    const metrics = await this.queryVideoMetrics(
      connection.accessToken,
      videoIds,
    );

    return videos.map((video) => {
      const m = metrics.find((x) => x.id === video.id);
      return {
        brandId: connection.brandId,
        connectionId: connection.id,
        externalId: video.id,
        publishedAt: new Date(video.create_time * 1000),
        type: 'video',
        caption: video.title ?? null,
        mediaUrl: video.cover_image_url ?? null,
        metrics: {
          likes: m?.like_count ?? 0,
          comments: m?.comment_count ?? 0,
          shares: m?.share_count ?? 0,
          views: m?.view_count ?? 0,
        },
      };
    });
  }

  async refreshToken(connection: Connection): Promise<TokenData> {
    this.ensureConfigured();
    if (!connection.refreshToken) {
      throw new Error('TikTok: no refresh token available for this connection');
    }
    const clientKey = this.config.getOrThrow<string>('TIKTOK_CLIENT_KEY');
    const clientSecret = this.config.getOrThrow<string>('TIKTOK_CLIENT_SECRET');

    const { data } = await axios.post<Record<string, unknown>>(
      TOKEN_URL,
      new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: connection.refreshToken,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    if (data['error']) {
      throw new Error(
        `TikTok token refresh: ${(data['error_description'] as string) ?? String(data['error'])}`,
      );
    }

    return {
      accessToken: data['access_token'] as string,
      refreshToken: data['refresh_token'] as string | undefined,
      expiresAt: new Date(Date.now() + (data['expires_in'] as number) * 1000),
    };
  }

  private async listVideos(
    accessToken: string,
    dateRange: DateRange,
  ): Promise<TiktokVideo[]> {
    const collected: TiktokVideo[] = [];
    let cursor: number | undefined;
    let hasMore = true;
    let pages = 0;
    const fromMs = dateRange.from.getTime();
    const toMs = dateRange.to.getTime();

    // video/list returns newest-first in pages of 20. Walk pages until TikTok
    // says there's nothing left or we've paged past the start of the range.
    while (hasMore && pages < MAX_VIDEO_PAGES) {
      const body: Record<string, unknown> = { max_count: VIDEO_PAGE_SIZE };
      if (cursor !== undefined) body.cursor = cursor;

      const { data } = await axios.post<Record<string, unknown>>(
        `${VIDEO_LIST_URL}?fields=id,create_time,title,cover_image_url`,
        body,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (
        data['error'] &&
        (data['error'] as Record<string, unknown>)['code'] !== 'ok'
      ) {
        throw new Error(`TikTok video list: ${JSON.stringify(data['error'])}`);
      }

      const payload = (data['data'] as Record<string, unknown>) ?? {};
      const videos = (payload['videos'] as TiktokVideo[]) ?? [];
      collected.push(...videos);

      hasMore = Boolean(payload['has_more']);
      cursor = payload['cursor'] as number | undefined;
      pages++;

      // Page is newest-first; once the oldest item predates the range start,
      // further pages are even older — stop early.
      const oldest = videos[videos.length - 1];
      if (oldest && oldest.create_time * 1000 < fromMs) break;
    }

    return collected.filter((v) => {
      const ts = v.create_time * 1000;
      return ts >= fromMs && ts <= toMs;
    });
  }

  private async fetchProfileStats(
    accessToken: string,
  ): Promise<TiktokProfileStats | null> {
    const { data } = await axios.get<Record<string, unknown>>(
      `${USER_INFO_URL}?fields=follower_count,following_count,likes_count,video_count`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (
      data['error'] &&
      (data['error'] as Record<string, unknown>)['code'] !== 'ok'
    ) {
      throw new Error(`TikTok user info: ${JSON.stringify(data['error'])}`);
    }

    return (
      ((data['data'] as Record<string, unknown>)?.[
        'user'
      ] as TiktokProfileStats) ?? null
    );
  }

  private async queryVideoMetrics(
    accessToken: string,
    videoIds: string[],
  ): Promise<TiktokVideoMetrics[]> {
    const results: TiktokVideoMetrics[] = [];

    // video/query accepts at most 20 ids per call — batch accordingly.
    for (let i = 0; i < videoIds.length; i += VIDEO_QUERY_CHUNK) {
      const chunk = videoIds.slice(i, i + VIDEO_QUERY_CHUNK);
      // TikTok requires `fields` as a URL query param for video/query (same as
      // video/list); passing it in the body returns 400 "fields is required".
      const { data } = await axios.post<Record<string, unknown>>(
        `${VIDEO_QUERY_URL}?fields=id,like_count,comment_count,share_count,view_count`,
        { filters: { video_ids: chunk } },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (
        data['error'] &&
        (data['error'] as Record<string, unknown>)['code'] !== 'ok'
      ) {
        throw new Error(`TikTok video query: ${JSON.stringify(data['error'])}`);
      }

      const videos =
        ((data['data'] as Record<string, unknown>)?.[
          'videos'
        ] as TiktokVideoMetrics[]) ?? [];
      results.push(...videos);
    }

    return results;
  }

  private ensureConfigured(): void {
    if (!this.config.get<string>('TIKTOK_CLIENT_KEY')) {
      throw new Error(
        'TikTok credentials not configured (TIKTOK_CLIENT_KEY missing)',
      );
    }
  }
}
