import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { GoogleAdsApi } from 'google-ads-api';
import { ChannelEnum } from '../../../connections/domain/channel.enum';
import { Connection } from '../../../connections/domain/connection';
import { MetricEnum } from '../../../metrics/domain/metric.enum';
import { AdCampaign } from '../../../analytics/domain/ad-campaign';
import { AdMetricSnapshot } from '../../../analytics/domain/ad-metric-snapshot';
import {
  ChannelProvider,
  DateRange,
  MetricRow,
  PostData,
  TokenData,
} from '../../channel-provider.interface';

export interface AdsFetchResult {
  campaigns: AdCampaign[];
  snapshots: AdMetricSnapshot[];
}

interface DailyAgg {
  impressions: number;
  clicks: number;
  costMicros: number;
  conversions: number;
}

@Injectable()
export class GoogleAdsProvider implements ChannelProvider {
  readonly channel = ChannelEnum.google_ads;
  private readonly logger = new Logger(GoogleAdsProvider.name);

  constructor(private readonly config: ConfigService) {}

  async fetchMetrics(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<MetricRow[]> {
    this.ensureConfigured();
    if (!connection.refreshToken) {
      throw new Error(
        'Google Ads: no refresh token available for this connection',
      );
    }

    const from = this.toIsoDate(dateRange.from);
    const to = this.toIsoDate(dateRange.to);

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

  async fetchAdData(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<AdsFetchResult> {
    this.ensureConfigured();
    if (!connection.refreshToken) {
      throw new Error(
        'Google Ads: no refresh token available for this connection',
      );
    }
    const from = this.toIsoDate(dateRange.from);
    const to = this.toIsoDate(dateRange.to);

    const customer = this.buildCustomer(connection);
    // One row per (campaign, date) via segments.date
    const rows = await customer.query(`
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value
      FROM campaign
      WHERE segments.date BETWEEN '${from}' AND '${to}'
        AND campaign.status != 'REMOVED'
    `);

    const campaignMap = new Map<string, AdCampaign>();
    const snapshots: AdMetricSnapshot[] = [];

    for (const row of rows) {
      const externalId = String(row.campaign?.id ?? '');
      if (!externalId) continue;

      if (!campaignMap.has(externalId)) {
        const c = new AdCampaign();
        c.brandId = connection.brandId;
        c.connectionId = connection.id;
        c.externalId = externalId;
        c.name = String(row.campaign?.name ?? `Campaign ${externalId}`);
        c.status = this.normalizeStatus(String(row.campaign?.status ?? ''));
        c.objective = String(
          row.campaign?.advertising_channel_type ?? 'UNSPECIFIED',
        );
        c.currency = 'USD';
        campaignMap.set(externalId, c);
      }

      const dateStr = row.segments?.date as string | undefined;
      if (!dateStr) continue;
      const date = new Date(dateStr);

      const impressions = Number(row.metrics?.impressions ?? 0);
      const clicks = Number(row.metrics?.clicks ?? 0);
      const spend = Number(row.metrics?.cost_micros ?? 0) / 1_000_000;
      const conversions = Number(row.metrics?.conversions ?? 0);

      const snap = new AdMetricSnapshot();
      // campaignId asignado en el processor (después de upsert de campañas)
      snap.brandId = connection.brandId;
      snap.date = date;
      snap.spend = spend;
      snap.impressions = impressions;
      snap.clicks = clicks;
      snap.conversions = conversions;
      snap.ctr = impressions > 0 ? clicks / impressions : undefined;
      snap.cpc = clicks > 0 ? spend / clicks : undefined;
      snap.cpm = impressions > 0 ? spend / (impressions / 1000) : undefined;
      snap.roas = spend > 0 ? conversions / spend : undefined;
      // tag temp con externalId para mapear después
      (snap as unknown as { _externalId: string })._externalId = externalId;

      snapshots.push(snap);
    }

    return {
      campaigns: Array.from(campaignMap.values()),
      snapshots,
    };
  }

  // async to satisfy the ChannelProvider interface; stub has no awaited I/O yet
  // eslint-disable-next-line @typescript-eslint/require-await
  async fetchPosts(
    _connection: Connection,
    _dateRange: DateRange,
  ): Promise<PostData[]> {
    return [];
  }

  async refreshToken(connection: Connection): Promise<TokenData> {
    this.ensureConfigured();
    if (!connection.refreshToken) {
      throw new Error(
        'Google Ads: no refresh token available for this connection',
      );
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
    const clientSecret = this.config.getOrThrow<string>(
      'GOOGLE_ADS_CLIENT_SECRET',
    );
    const developerToken = this.config.getOrThrow<string>(
      'GOOGLE_ADS_DEVELOPER_TOKEN',
    );
    const loginCustomerId = this.config.get<string>(
      'GOOGLE_ADS_LOGIN_CUSTOMER_ID',
    );

    const adsClient = new GoogleAdsApi({
      client_id: clientId,
      client_secret: clientSecret,
      developer_token: developerToken,
    });

    return adsClient.Customer({
      customer_id: connection.accountId,
      refresh_token: connection.refreshToken!,
      ...(loginCustomerId ? { login_customer_id: loginCustomerId } : {}),
    });
  }

  private normalizeStatus(raw: string): string {
    const s = raw.toUpperCase();
    if (s === 'ENABLED') return 'active';
    if (s === 'PAUSED') return 'paused';
    if (s === 'REMOVED') return 'archived';
    return s.toLowerCase() || 'active';
  }

  private toIsoDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  private ensureConfigured(): void {
    if (!this.config.get<string>('GOOGLE_ADS_CLIENT_ID')) {
      throw new Error(
        'Google Ads credentials not configured (GOOGLE_ADS_CLIENT_ID missing)',
      );
    }
  }
}
