import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { google } from 'googleapis';
import { GoogleAuth, OAuth2Client } from 'google-auth-library';
import { ChannelEnum } from '../../../connections/domain/channel.enum';
import { Connection } from '../../../connections/domain/connection';
import { MetricEnum } from '../../../metrics/domain/metric.enum';
import { WebDimensionEnum } from '../../../analytics/domain/web-dimension.enum';
import {
  ChannelProvider,
  DateRange,
  MetricRow,
  PostData,
  TokenData,
} from '../../channel-provider.interface';

export interface WebBreakdownRow {
  connectionId: number;
  brandId: number;
  date: Date;
  dimension: WebDimensionEnum;
  dimensionValue: string;
  sessions: number;
  users: number;
  conversions: number;
}

const DIMENSION_TO_GA4: Record<WebDimensionEnum, string> = {
  [WebDimensionEnum.source]: 'sessionSourceMedium',
  [WebDimensionEnum.device]: 'deviceCategory',
  [WebDimensionEnum.page]: 'pagePath',
  [WebDimensionEnum.country]: 'country',
  [WebDimensionEnum.city]: 'city',
};

@Injectable()
export class Ga4Provider implements ChannelProvider {
  readonly channel = ChannelEnum.ga4;
  private readonly logger = new Logger(Ga4Provider.name);

  constructor(private readonly config: ConfigService) {}

  async fetchMetrics(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<MetricRow[]> {
    this.ensureConfigured();
    const propertyId = connection.accountId;
    const from = this.toIsoDate(dateRange.from);
    const to = this.toIsoDate(dateRange.to);

    const client = this.buildClient(connection);
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: from, endDate: to }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'screenPageViews' },
        { name: 'conversions' },
        { name: 'bounceRate' },
        { name: 'engagementRate' },
        { name: 'averageSessionDuration' },
      ],
    });

    const rows: MetricRow[] = [];
    for (const row of response.rows ?? []) {
      const date = this.parseGa4Date(row.dimensionValues?.[0]?.value ?? '');
      if (!date) continue;
      const vals = (row.metricValues ?? []).map((m) =>
        parseFloat(m.value ?? '0'),
      );
      const [
        sessions,
        users,
        pageViews,
        conversions,
        bounceRate,
        engagementRate,
        avgSessionDuration,
      ] = vals;

      const base = {
        connectionId: connection.id,
        brandId: connection.brandId,
        date,
      };

      rows.push(
        { ...base, metric: MetricEnum.sessions, value: sessions },
        { ...base, metric: MetricEnum.users, value: users },
        { ...base, metric: MetricEnum.page_views, value: pageViews },
        { ...base, metric: MetricEnum.conversions, value: conversions },
        // GA4 returns ratios in 0..1 — store as percentage to match UI
        {
          ...base,
          metric: MetricEnum.bounce_rate,
          value: bounceRate * 100,
        },
        {
          ...base,
          metric: MetricEnum.engagement_rate_pct,
          value: engagementRate * 100,
        },
        {
          ...base,
          metric: MetricEnum.avg_session_duration,
          value: avgSessionDuration,
        },
      );
    }
    return rows;
  }

  async fetchBreakdown(
    connection: Connection,
    dateRange: DateRange,
    dimension: WebDimensionEnum,
  ): Promise<WebBreakdownRow[]> {
    this.ensureConfigured();
    const propertyId = connection.accountId;
    const from = this.toIsoDate(dateRange.from);
    const to = this.toIsoDate(dateRange.to);
    const ga4Dim = DIMENSION_TO_GA4[dimension];

    const client = this.buildClient(connection);
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: from, endDate: to }],
      dimensions: [{ name: 'date' }, { name: ga4Dim }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'conversions' },
      ],
      // safety cap — large properties can return thousands per day
      limit: 10000,
    });

    const rows: WebBreakdownRow[] = [];
    for (const row of response.rows ?? []) {
      const date = this.parseGa4Date(row.dimensionValues?.[0]?.value ?? '');
      const dimensionValue = row.dimensionValues?.[1]?.value ?? '';
      if (!date || !dimensionValue) continue;
      const vals = (row.metricValues ?? []).map((m) =>
        parseFloat(m.value ?? '0'),
      );
      const [sessions, users, conversions] = vals;
      rows.push({
        connectionId: connection.id,
        brandId: connection.brandId,
        date,
        dimension,
        dimensionValue: dimensionValue.slice(0, 255),
        sessions,
        users,
        conversions,
      });
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

  private buildClient(connection: Connection): BetaAnalyticsDataClient {
    // @google-analytics/data (google-gax v5) calls `auth.getUniverseDomain()`,
    // which a bare OAuth2Client does not implement. Wrapping the OAuth2 client
    // in GoogleAuth provides that method while delegating requests to the
    // user's credentials (GoogleAuth.getClient() returns this authClient).
    const oauth = new OAuth2Client(
      this.config.getOrThrow<string>('GA4_CLIENT_ID'),
      this.config.getOrThrow<string>('GA4_CLIENT_SECRET'),
    );
    oauth.setCredentials({
      access_token: connection.accessToken,
      refresh_token: connection.refreshToken ?? undefined,
    });
    const auth = new GoogleAuth({ authClient: oauth });
    return new BetaAnalyticsDataClient({
      auth: auth as unknown as never,
    });
  }

  private toIsoDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  private parseGa4Date(raw: string): Date | null {
    // GA4 returns 'YYYYMMDD'
    if (!/^\d{8}$/.test(raw)) return null;
    return new Date(
      `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T00:00:00Z`,
    );
  }

  private ensureConfigured(): void {
    if (!this.config.get<string>('GA4_CLIENT_ID')) {
      throw new Error('GA4 credentials not configured (GA4_CLIENT_ID missing)');
    }
  }
}
