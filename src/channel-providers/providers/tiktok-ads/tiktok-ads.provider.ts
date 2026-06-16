import { Injectable } from '@nestjs/common';
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

const API_BASE = 'https://business-api.tiktok.com/open_api/v1.3';

interface TtCampaign {
  campaign_id: string;
  campaign_name: string;
  operation_status?: string;
  objective_type?: string;
  budget?: number;
}

interface TtReportRow {
  dimensions: { campaign_id: string; stat_time_day: string };
  metrics: {
    spend?: string;
    impressions?: string;
    clicks?: string;
    conversion?: string;
    ctr?: string;
    cpc?: string;
    cpm?: string;
  };
}

@Injectable()
export class TiktokAdsProvider implements ChannelProvider {
  readonly channel = ChannelEnum.tiktok_ads;

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
    const advertiserId = connection.accountId;
    const headers = { 'Access-Token': connection.accessToken };

    const campaigns = await this.listCampaigns(advertiserId, headers);
    // TikTok's report API caps stat_time_day ranges at 30 days, so split
    // longer ranges into <=30-day windows and concatenate the rows.
    const report: TtReportRow[] = [];
    for (const [wFrom, wTo] of this.splitRange(
      dateRange.from,
      dateRange.to,
      30,
    )) {
      report.push(...(await this.fetchReport(advertiserId, wFrom, wTo, headers)));
    }

    const campaignMap = new Map<string, AdCampaign>();
    for (const c of campaigns) {
      const ad = new AdCampaign();
      ad.brandId = connection.brandId;
      ad.connectionId = connection.id;
      ad.externalId = c.campaign_id;
      ad.name = c.campaign_name;
      ad.status = this.normalizeStatus(c.operation_status ?? '');
      ad.objective = c.objective_type ?? 'UNSPECIFIED';
      ad.budget = c.budget;
      ad.currency = 'USD';
      campaignMap.set(c.campaign_id, ad);
    }

    const snapshots: AdMetricSnapshot[] = [];
    for (const row of report) {
      const externalId = row.dimensions?.campaign_id;
      if (!externalId || !campaignMap.has(externalId)) continue;
      const date = new Date(row.dimensions.stat_time_day);
      const spend = Number(row.metrics?.spend ?? 0);
      const impressions = Number(row.metrics?.impressions ?? 0);
      const clicks = Number(row.metrics?.clicks ?? 0);
      const conversions = Number(row.metrics?.conversion ?? 0);

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
    throw new Error(
      'TikTok Ads tokens cannot be silently refreshed — user must reauth',
    );
  }

  private async listCampaigns(
    advertiserId: string,
    headers: Record<string, string>,
  ): Promise<TtCampaign[]> {
    const url = `${API_BASE}/campaign/get/`;
    const params = {
      advertiser_id: advertiserId,
      page_size: 200,
      fields: JSON.stringify([
        'campaign_id',
        'campaign_name',
        'operation_status',
        'objective_type',
        'budget',
      ]),
    };
    const { data } = await axios.get<{
      code: number;
      message: string;
      data?: { list?: TtCampaign[] };
    }>(url, { params, headers });
    if (data.code !== 0) {
      throw new Error(
        `TikTok campaign/get failed (code ${data.code}): ${data.message}`,
      );
    }
    return data.data?.list ?? [];
  }

  private async fetchReport(
    advertiserId: string,
    from: string,
    to: string,
    headers: Record<string, string>,
  ): Promise<TtReportRow[]> {
    const url = `${API_BASE}/report/integrated/get/`;
    const params = {
      advertiser_id: advertiserId,
      service_type: 'AUCTION',
      report_type: 'BASIC',
      data_level: 'AUCTION_CAMPAIGN',
      dimensions: JSON.stringify(['campaign_id', 'stat_time_day']),
      metrics: JSON.stringify([
        'spend',
        'impressions',
        'clicks',
        'conversion',
        'ctr',
        'cpc',
        'cpm',
      ]),
      start_date: from,
      end_date: to,
      page_size: 500,
    };
    const { data } = await axios.get<{
      code: number;
      message: string;
      data?: { list?: TtReportRow[] };
    }>(url, { params, headers });
    if (data.code !== 0) {
      throw new Error(
        `TikTok report failed (code ${data.code}): ${data.message}`,
      );
    }
    return data.data?.list ?? [];
  }

  private normalizeStatus(s: string): string {
    const v = s.toUpperCase();
    if (v.includes('DISABLE') || v === 'CAMPAIGN_STATUS_DELETE')
      return 'archived';
    if (v.includes('ENABLE') || v === 'CAMPAIGN_STATUS_ENABLE') return 'active';
    if (v.includes('PAUSE')) return 'paused';
    return 'active';
  }

  private toIsoDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  private splitRange(
    from: Date,
    to: Date,
    maxDays: number,
  ): Array<[string, string]> {
    const windows: Array<[string, string]> = [];
    const cursor = new Date(from);
    while (cursor <= to) {
      const end = new Date(cursor);
      end.setUTCDate(end.getUTCDate() + maxDays - 1);
      const windowEnd = end < to ? end : to;
      windows.push([this.toIsoDate(cursor), this.toIsoDate(windowEnd)]);
      cursor.setTime(windowEnd.getTime());
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return windows;
  }
}
