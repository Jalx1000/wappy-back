import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { GoogleAdsApi } from 'google-ads-api';
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

interface DailyAgg {
  impressions: number;
  clicks: number;
  costMicros: number;
  conversions: number;
}

@Injectable()
export class GoogleAdsProvider implements ChannelProvider {
  readonly channel = ChannelEnum.google_ads;

  constructor(private readonly config: ConfigService) {}

  async fetchMetrics(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<MetricRow[]> {
    this.ensureConfigured();
    if (!connection.refreshToken) {
      throw new Error('Google Ads: no refresh token available for this connection');
    }

    const from = dateRange.from.toISOString().split('T')[0];
    const to = dateRange.to.toISOString().split('T')[0];

    const customer = this.buildCustomer(connection);
    const gaqlRows = await customer.query(`
      SELECT
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM campaign
      WHERE segments.date BETWEEN '${from}' AND '${to}'
        AND campaign.status != 'REMOVED'
    `);

    const daily = new Map<string, DailyAgg>();
    for (const row of gaqlRows) {
      const dateStr = row.segments?.date as string | undefined;
      if (!dateStr) continue;
      const agg = daily.get(dateStr) ?? {
        impressions: 0,
        clicks: 0,
        costMicros: 0,
        conversions: 0,
      };
      agg.impressions += Number(row.metrics?.impressions ?? 0);
      agg.clicks += Number(row.metrics?.clicks ?? 0);
      agg.costMicros += Number(row.metrics?.cost_micros ?? 0);
      agg.conversions += Number(row.metrics?.conversions ?? 0);
      daily.set(dateStr, agg);
    }

    const metricRows: MetricRow[] = [];
    for (const [dateStr, agg] of daily) {
      const date = new Date(dateStr);
      metricRows.push(
        {
          connectionId: connection.id,
          brandId: connection.brandId,
          date,
          metric: MetricEnum.impressions,
          value: agg.impressions,
        },
        {
          connectionId: connection.id,
          brandId: connection.brandId,
          date,
          metric: MetricEnum.clicks,
          value: agg.clicks,
        },
        {
          connectionId: connection.id,
          brandId: connection.brandId,
          date,
          metric: MetricEnum.spend,
          value: agg.costMicros / 1_000_000,
        },
        {
          connectionId: connection.id,
          brandId: connection.brandId,
          date,
          metric: MetricEnum.conversions,
          value: agg.conversions,
        },
      );
    }
    return metricRows;
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
      throw new Error('Google Ads: no refresh token available for this connection');
    }
    const oauth2Client = new google.auth.OAuth2(
      this.config.getOrThrow<string>('GOOGLE_ADS_CLIENT_ID'),
      this.config.getOrThrow<string>('GOOGLE_ADS_CLIENT_SECRET'),
    );
    oauth2Client.setCredentials({ refresh_token: connection.refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();
    return {
      accessToken: credentials.access_token!,
      expiresAt: credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : new Date(Date.now() + 3600 * 1000),
    };
  }

  private buildCustomer(connection: Connection) {
    const clientId = this.config.getOrThrow<string>('GOOGLE_ADS_CLIENT_ID');
    const clientSecret = this.config.getOrThrow<string>('GOOGLE_ADS_CLIENT_SECRET');
    const developerToken = this.config.getOrThrow<string>('GOOGLE_ADS_DEVELOPER_TOKEN');

    const adsClient = new GoogleAdsApi({
      client_id: clientId,
      client_secret: clientSecret,
      developer_token: developerToken,
    });

    return adsClient.Customer({
      customer_id: connection.accountId,
      refresh_token: connection.refreshToken!,
    });
  }

  private ensureConfigured(): void {
    if (!this.config.get<string>('GOOGLE_ADS_CLIENT_ID')) {
      throw new Error('Google Ads credentials not configured (GOOGLE_ADS_CLIENT_ID missing)');
    }
  }
}
