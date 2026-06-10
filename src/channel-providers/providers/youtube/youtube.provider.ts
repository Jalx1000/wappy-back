import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
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

@Injectable()
export class YoutubeProvider implements ChannelProvider {
  readonly channel = ChannelEnum.youtube;

  constructor(private readonly config: ConfigService) {}

  async fetchMetrics(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<MetricRow[]> {
    this.ensureConfigured();
    const auth = this.buildAuth(connection);
    const ytAnalytics = google.youtubeAnalytics({ version: 'v2', auth });

    const from = dateRange.from.toISOString().split('T')[0];
    const to = dateRange.to.toISOString().split('T')[0];

    const res = await ytAnalytics.reports.query({
      ids: `channel==${connection.accountId}`,
      metrics: 'views,likes,comments,shares,subscribersGained',
      dimensions: 'day',
      startDate: from,
      endDate: to,
    });

    const columnHeaders = res.data.columnHeaders ?? [];
    const colIndex = Object.fromEntries(columnHeaders.map((h, i) => [h.name!, i]));
    const rows: MetricRow[] = [];

    for (const row of res.data.rows ?? []) {
      const date = new Date(row[colIndex['day']] as string);
      const push = (metric: string, col: string) => {
        const idx = colIndex[col];
        if (idx !== undefined) {
          rows.push({
            connectionId: connection.id,
            brandId: connection.brandId,
            date,
            metric,
            value: Number(row[idx]),
          });
        }
      };
      push(MetricEnum.impressions, 'views');
      push(MetricEnum.likes, 'likes');
      push(MetricEnum.comments, 'comments');
      push(MetricEnum.shares, 'shares');
      push(MetricEnum.followers, 'subscribersGained');
    }
    return rows;
  }

  async fetchPosts(
    _connection: Connection,
    _dateRange: DateRange,
  ): Promise<PostData[]> {
    this.ensureConfigured();
    return [];
  }

  async refreshToken(connection: Connection): Promise<TokenData> {
    this.ensureConfigured();
    if (!connection.refreshToken) {
      throw new Error('YouTube: no refresh token available for this connection');
    }
    const auth = new google.auth.OAuth2(
      this.config.getOrThrow<string>('YOUTUBE_CLIENT_ID'),
      this.config.getOrThrow<string>('YOUTUBE_CLIENT_SECRET'),
    );
    auth.setCredentials({ refresh_token: connection.refreshToken });
    const { credentials } = await auth.refreshAccessToken();
    return {
      accessToken: credentials.access_token!,
      expiresAt: credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : new Date(Date.now() + 3600 * 1000),
    };
  }

  private buildAuth(connection: Connection) {
    const auth = new google.auth.OAuth2(
      this.config.getOrThrow<string>('YOUTUBE_CLIENT_ID'),
      this.config.getOrThrow<string>('YOUTUBE_CLIENT_SECRET'),
    );
    auth.setCredentials({
      access_token: connection.accessToken,
      refresh_token: connection.refreshToken ?? undefined,
    });
    return auth;
  }

  private ensureConfigured(): void {
    if (!this.config.get<string>('YOUTUBE_CLIENT_ID')) {
      throw new Error('YouTube credentials not configured (YOUTUBE_CLIENT_ID missing)');
    }
  }
}
