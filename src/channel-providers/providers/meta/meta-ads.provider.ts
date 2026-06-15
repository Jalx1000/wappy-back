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

const GRAPH_VERSION_DEFAULT = 'v25.0';

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  daily_budget?: string;
  lifetime_budget?: string;
}

interface MetaInsight {
  campaign_id?: string;
  campaign_name?: string;
  date_start: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  actions?: Array<{ action_type: string; value: string }>;
  action_values?: Array<{ action_type: string; value: string }>;
}

@Injectable()
export class MetaAdsProvider implements ChannelProvider {
  readonly channel = ChannelEnum.meta_ads;
  private readonly logger = new Logger(MetaAdsProvider.name);

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
    const result = await this.fetchAdData(connection, dateRange);
    const byDay = new Map<
      string,
      { spend: number; clicks: number; impressions: number; conversions: number }
    >();
    for (const s of result.snapshots) {
      const k = new Date(s.date).toISOString().slice(0, 10);
      const agg = byDay.get(k) ?? {
        spend: 0,
        clicks: 0,
        impressions: 0,
        conversions: 0,
      };
      agg.spend += s.spend;
      agg.clicks += s.clicks;
      agg.impressions += s.impressions;
      agg.conversions += s.conversions;
      byDay.set(k, agg);
    }
    const rows: MetricRow[] = [];
    for (const [k, agg] of byDay) {
      const date = new Date(k);
      rows.push(
        {
          connectionId: connection.id,
          brandId: connection.brandId,
          date,
          metric: MetricEnum.spend,
          value: agg.spend,
        },
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
          metric: MetricEnum.conversions,
          value: agg.conversions,
        },
      );
    }
    return rows;
  }

  async fetchAdData(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<AdsFetchResult> {
    const accountId = connection.accountId; // numeric act id
    const since = this.toIsoDate(dateRange.from);
    const until = this.toIsoDate(dateRange.to);

    const campaigns = await this.fetchCampaigns(
      accountId,
      connection.accessToken,
    );
    const insights = await this.fetchInsights(
      accountId,
      connection.accessToken,
      since,
      until,
    );

    const campaignMap = new Map<string, AdCampaign>();
    for (const c of campaigns) {
      const ad = new AdCampaign();
      ad.brandId = connection.brandId;
      ad.connectionId = connection.id;
      ad.externalId = c.id;
      ad.name = c.name;
      ad.status = this.normalizeStatus(c.status);
      ad.objective = c.objective ?? 'UNSPECIFIED';
      ad.budget = c.daily_budget
        ? Number(c.daily_budget) / 100
        : c.lifetime_budget
          ? Number(c.lifetime_budget) / 100
          : undefined;
      ad.currency = 'USD';
      campaignMap.set(c.id, ad);
    }

    const snapshots: AdMetricSnapshot[] = [];
    for (const ins of insights) {
      const externalId = ins.campaign_id;
      if (!externalId || !campaignMap.has(externalId)) continue;
      const spend = Number(ins.spend ?? 0);
      const impressions = Number(ins.impressions ?? 0);
      const clicks = Number(ins.clicks ?? 0);
      const conversions = this.sumActions(ins.actions);
      const date = new Date(ins.date_start);

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

    return {
      campaigns: Array.from(campaignMap.values()),
      snapshots,
    };
  }

  async fetchPosts(
    _connection: Connection,
    _dateRange: DateRange,
  ): Promise<PostData[]> {
    return [];
  }

  async refreshToken(_connection: Connection): Promise<TokenData> {
    // Meta long-lived tokens last ~60d and can't be silently refreshed;
    // user must reauth. Return existing.
    throw new Error('Meta Ads tokens require user reauth, not refresh');
  }

  private async fetchCampaigns(
    accountId: string,
    accessToken: string,
  ): Promise<MetaCampaign[]> {
    const fields = [
      'id',
      'name',
      'status',
      'objective',
      'daily_budget',
      'lifetime_budget',
    ].join(',');
    const params = new URLSearchParams({
      access_token: accessToken,
      fields,
      limit: '200',
    });
    const url = `${this.graphUrl}/act_${accountId}/campaigns?${params.toString()}`;
    const { data } = await axios.get<{ data?: MetaCampaign[] }>(url);
    return data.data ?? [];
  }

  private async fetchInsights(
    accountId: string,
    accessToken: string,
    since: string,
    until: string,
  ): Promise<MetaInsight[]> {
    const fields = [
      'campaign_id',
      'campaign_name',
      'date_start',
      'spend',
      'impressions',
      'clicks',
      'ctr',
      'cpc',
      'cpm',
      'actions',
      'action_values',
    ].join(',');
    const params = new URLSearchParams({
      access_token: accessToken,
      fields,
      level: 'campaign',
      time_increment: '1',
      time_range: JSON.stringify({ since, until }),
      limit: '500',
    });
    const url = `${this.graphUrl}/act_${accountId}/insights?${params.toString()}`;
    const { data } = await axios.get<{ data?: MetaInsight[] }>(url);
    return data.data ?? [];
  }

  private sumActions(actions?: MetaInsight['actions']): number {
    if (!actions) return 0;
    const CONV_TYPES = new Set([
      'purchase',
      'offsite_conversion.fb_pixel_purchase',
      'lead',
      'complete_registration',
    ]);
    return actions
      .filter((a) => CONV_TYPES.has(a.action_type))
      .reduce((acc, a) => acc + Number(a.value ?? 0), 0);
  }

  private normalizeStatus(s: string): string {
    const v = s.toUpperCase();
    if (v === 'ACTIVE') return 'active';
    if (v === 'PAUSED') return 'paused';
    if (v === 'ARCHIVED' || v === 'DELETED') return 'archived';
    return s.toLowerCase() || 'active';
  }

  private toIsoDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}
