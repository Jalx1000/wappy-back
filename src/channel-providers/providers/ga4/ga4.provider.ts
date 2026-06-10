import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
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
export class Ga4Provider implements ChannelProvider {
  readonly channel = ChannelEnum.ga4;

  constructor(private readonly config: ConfigService) {}

  async fetchMetrics(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<MetricRow[]> {
    this.ensureConfigured();
    const propertyId = connection.accountId;
    const from = dateRange.from.toISOString().split('T')[0];
    const to = dateRange.to.toISOString().split('T')[0];

    const auth = this.buildAuth(connection);
    // Cast auth to any to bridge the dual google-auth-library version conflict
    const analyticsClient = new BetaAnalyticsDataClient({ auth: auth as unknown as never });

    const [response] = await analyticsClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: from, endDate: to }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'conversions' },
        { name: 'bounceRate' },
      ],
    });

    const rows: MetricRow[] = [];
    for (const row of response.rows ?? []) {
      const rawDate = row.dimensionValues?.[0]?.value ?? '';
      const date = new Date(
        `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`,
      );
      const vals = (row.metricValues ?? []).map((m) => parseFloat(m.value ?? '0'));
      const [sessions, activeUsers, pageViews, conversions, bounceRate] = vals;

      rows.push(
        {
          connectionId: connection.id,
          brandId: connection.brandId,
          date,
          metric: MetricEnum.sessions,
          value: sessions,
        },
        {
          connectionId: connection.id,
          brandId: connection.brandId,
          date,
          metric: MetricEnum.followers,
          value: activeUsers,
        },
        {
          connectionId: connection.id,
          brandId: connection.brandId,
          date,
          metric: MetricEnum.impressions,
          value: pageViews,
        },
        {
          connectionId: connection.id,
          brandId: connection.brandId,
          date,
          metric: MetricEnum.conversions,
          value: conversions,
        },
        {
          connectionId: connection.id,
          brandId: connection.brandId,
          date,
          metric: MetricEnum.engagement_rate,
          value: bounceRate,
        },
      );
    }
    return rows;
  }

  async fetchPosts(
    _connection: Connection,
    _dateRange: DateRange,
  ): Promise<PostData[]> {
    return [];
  }

  async refreshToken(connection: Connection): Promise<TokenData> {
    this.ensureConfigured();
    if (!connection.refreshToken) {
      throw new Error('GA4: no refresh token available for this connection');
    }
    const auth = new google.auth.OAuth2(
      this.config.getOrThrow<string>('GA4_CLIENT_ID'),
      this.config.getOrThrow<string>('GA4_CLIENT_SECRET'),
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
      this.config.getOrThrow<string>('GA4_CLIENT_ID'),
      this.config.getOrThrow<string>('GA4_CLIENT_SECRET'),
    );
    auth.setCredentials({
      access_token: connection.accessToken,
      refresh_token: connection.refreshToken ?? undefined,
    });
    return auth;
  }

  private ensureConfigured(): void {
    if (!this.config.get<string>('GA4_CLIENT_ID')) {
      throw new Error('GA4 credentials not configured (GA4_CLIENT_ID missing)');
    }
  }
}
