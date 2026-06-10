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

const VIDEO_LIST_URL = 'https://open.tiktokapis.com/v2/video/list/';
const VIDEO_QUERY_URL = 'https://open.tiktokapis.com/v2/video/query/';
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
  reach: number;
}

@Injectable()
export class TiktokProvider implements ChannelProvider {
  readonly channel = ChannelEnum.tiktok;

  constructor(private readonly config: ConfigService) {}

  async fetchMetrics(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<MetricRow[]> {
    this.ensureConfigured();
    const videos = await this.listVideos(connection.accessToken, dateRange);
    if (videos.length === 0) return [];

    const videoIds = videos.map((v) => v.id);
    const metrics = await this.queryVideoMetrics(connection.accessToken, videoIds);

    const daily = new Map<
      string,
      { likes: number; comments: number; shares: number; views: number; reach: number }
    >();

    for (const video of videos) {
      const dateKey = new Date(video.create_time * 1000).toISOString().split('T')[0];
      const m = metrics.find((x) => x.id === video.id);
      if (!m) continue;
      const existing = daily.get(dateKey) ?? {
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0,
        reach: 0,
      };
      existing.likes += m.like_count;
      existing.comments += m.comment_count;
      existing.shares += m.share_count;
      existing.views += m.view_count;
      existing.reach += m.reach;
      daily.set(dateKey, existing);
    }

    const rows: MetricRow[] = [];
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
          metric: MetricEnum.reach,
          value: agg.reach,
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
    const metrics = await this.queryVideoMetrics(connection.accessToken, videoIds);

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
    const { data } = await axios.post<Record<string, unknown>>(
      `${VIDEO_LIST_URL}?fields=id,create_time,title,cover_image_url`,
      { max_count: 20 },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (data['error']) {
      throw new Error(`TikTok video list: ${JSON.stringify(data['error'])}`);
    }

    const videos: TiktokVideo[] =
      ((data['data'] as Record<string, unknown>)?.['videos'] as TiktokVideo[]) ?? [];

    return videos.filter((v) => {
      const ts = v.create_time * 1000;
      return ts >= dateRange.from.getTime() && ts <= dateRange.to.getTime();
    });
  }

  private async queryVideoMetrics(
    accessToken: string,
    videoIds: string[],
  ): Promise<TiktokVideoMetrics[]> {
    const { data } = await axios.post<Record<string, unknown>>(
      VIDEO_QUERY_URL,
      {
        filters: { video_ids: videoIds },
        fields: ['id', 'like_count', 'comment_count', 'share_count', 'view_count', 'reach'],
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (data['error']) {
      throw new Error(`TikTok video query: ${JSON.stringify(data['error'])}`);
    }

    return (
      ((data['data'] as Record<string, unknown>)?.['videos'] as TiktokVideoMetrics[]) ?? []
    );
  }

  private ensureConfigured(): void {
    if (!this.config.get<string>('TIKTOK_CLIENT_KEY')) {
      throw new Error('TikTok credentials not configured (TIKTOK_CLIENT_KEY missing)');
    }
  }
}
