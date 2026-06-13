import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
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
import { AdsFetchResult } from '../google-ads/google-ads.provider';

const REST_BASE = 'https://api.linkedin.com/rest';
const HEADERS_VERSION = '202402';

interface LiCampaign {
  id: number;
  name: string;
  status: string;
  objectiveType?: string;
  totalBudget?: { amount: string; currencyCode: string };
}

interface LiAnalytics {
  pivotValues?: string[];
  dateRange?: { start: { year: number; month: number; day: number } };
  impressions?: number;
  clicks?: number;
  costInUsd?: string;
  externalWebsiteConversions?: number;
}

@Injectable()
export class LinkedinAdsProvider implements ChannelProvider {
  readonly channel = ChannelEnum.linkedin_ads;
  private readonly logger = new Logger(LinkedinAdsProvider.name);

  constructor(private readonly config: ConfigService) {}

  async fetchMetrics(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<MetricRow[]> {
    const r = await this.fetchAdData(connection, dateRange);
    return r.snapshots.flatMap((s) => [
      {
        connectionId: connection.id,
        brandId: connection.brandId,
        date: s.date,
        metric: MetricEnum.spend,
        value: s.spend,
      },
      {
        connectionId: connection.id,
        brandId: connection.brandId,
        date: s.date,
        metric: MetricEnum.impressions,
        value: s.impressions,
      },
      {
        connectionId: connection.id,
        brandId: connection.brandId,
        date: s.date,
        metric: MetricEnum.clicks,
        value: s.clicks,
      },
      {
        connectionId: connection.id,
        brandId: connection.brandId,
        date: s.date,
        metric: MetricEnum.conversions,
        value: s.conversions,
      },
    ]);
  }

  async fetchAdData(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<AdsFetchResult> {
    const accountUrn = `urn:li:sponsoredAccount:${connection.accountId}`;
    const headers = {
      Authorization: `Bearer ${connection.accessToken}`,
      'LinkedIn-Version': HEADERS_VERSION,
      'X-Restli-Protocol-Version': '2.0.0',
    };

    const campaigns = await this.listCampaigns(connection.accountId, headers);
    const analytics = await this.fetchAnalytics(
      accountUrn,
      dateRange.from,
      dateRange.to,
      headers,
    );

    const campaignMap = new Map<string, AdCampaign>();
    for (const c of campaigns) {
      const ad = new AdCampaign();
      ad.brandId = connection.brandId;
      ad.connectionId = connection.id;
      ad.externalId = String(c.id);
      ad.name = c.name;
      ad.status = this.normalizeStatus(c.status);
      ad.objective = c.objectiveType ?? 'UNSPECIFIED';
      ad.budget = c.totalBudget?.amount
        ? Number(c.totalBudget.amount)
        : undefined;
      ad.currency = c.totalBudget?.currencyCode ?? 'USD';
      campaignMap.set(String(c.id), ad);
    }

    const snapshots: AdMetricSnapshot[] = [];
    for (const row of analytics) {
      const pivot = row.pivotValues?.[0];
      if (!pivot) continue;
      const externalId = pivot.replace('urn:li:sponsoredCampaign:', '');
      if (!campaignMap.has(externalId)) continue;

      const d = row.dateRange?.start;
      if (!d) continue;
      const date = new Date(
        Date.UTC(d.year, (d.month ?? 1) - 1, d.day ?? 1),
      );

      const spend = Number(row.costInUsd ?? 0);
      const impressions = Number(row.impressions ?? 0);
      const clicks = Number(row.clicks ?? 0);
      const conversions = Number(row.externalWebsiteConversions ?? 0);

      const snap = new AdMetricSnapshot();
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
      (snap as unknown as { _externalId: string })._externalId = externalId;
      snapshots.push(snap);
    }

    return { campaigns: Array.from(campaignMap.values()), snapshots };
  }

  async fetchPosts(
    _connection: Connection,
    _dateRange: DateRange,
  ): Promise<PostData[]> {
    return [];
  }

  async refreshToken(_connection: Connection): Promise<TokenData> {
    throw new Error('LinkedIn Ads tokens require user reauth');
  }

  private async listCampaigns(
    accountId: string,
    headers: Record<string, string>,
  ): Promise<LiCampaign[]> {
    const url = `${REST_BASE}/adAccounts/${accountId}/adCampaigns?q=search&search=(status:(values:List(ACTIVE,PAUSED)))&count=200`;
    try {
      const { data } = await axios.get<{ elements?: LiCampaign[] }>(url, {
        headers,
      });
      return data.elements ?? [];
    } catch (err) {
      this.logger.warn(`LinkedIn campaigns failed: ${(err as Error).message}`);
      return [];
    }
  }

  private async fetchAnalytics(
    accountUrn: string,
    from: Date,
    to: Date,
    headers: Record<string, string>,
  ): Promise<LiAnalytics[]> {
    const start = `(year:${from.getUTCFullYear()},month:${from.getUTCMonth() + 1},day:${from.getUTCDate()})`;
    const end = `(year:${to.getUTCFullYear()},month:${to.getUTCMonth() + 1},day:${to.getUTCDate()})`;
    const query =
      `q=analytics&pivot=CAMPAIGN&timeGranularity=DAILY` +
      `&dateRange=(start:${start},end:${end})` +
      `&accounts=List(${encodeURIComponent(accountUrn)})` +
      `&fields=pivotValues,dateRange,impressions,clicks,costInUsd,externalWebsiteConversions`;

    const url = `${REST_BASE}/adAnalytics?${query}`;
    try {
      const { data } = await axios.get<{ elements?: LiAnalytics[] }>(url, {
        headers,
      });
      return data.elements ?? [];
    } catch (err) {
      this.logger.warn(`LinkedIn analytics failed: ${(err as Error).message}`);
      return [];
    }
  }

  private normalizeStatus(s: string): string {
    const v = s.toUpperCase();
    if (v === 'ACTIVE') return 'active';
    if (v === 'PAUSED') return 'paused';
    if (v === 'COMPLETED' || v === 'ARCHIVED') return 'archived';
    return 'active';
  }
}
