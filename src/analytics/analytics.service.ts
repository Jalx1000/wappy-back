import { Injectable, NotFoundException } from '@nestjs/common';
import { MetricSnapshotsRepository } from '../metrics/infrastructure/persistence/relational/repositories/metric-snapshots.repository';
import { PostsRepository } from '../metrics/infrastructure/persistence/relational/repositories/posts.repository';
import { AdMetricSnapshotsRepository } from './infrastructure/persistence/relational/repositories/ad-metric-snapshots.repository';
import { AdCampaignsRepository } from './infrastructure/persistence/relational/repositories/ad-campaigns.repository';
import { WebDimensionSnapshotsRepository } from './infrastructure/persistence/relational/repositories/web-dimension-snapshots.repository';
import { ConnectionsRepository } from '../connections/infrastructure/persistence/relational/repositories/connections.repository';
import { MetricSnapshot } from '../metrics/domain/metric-snapshot';
import { Post } from '../metrics/domain/post';
import { MetricEnum } from '../metrics/domain/metric.enum';
import { WebDimensionEnum } from './domain/web-dimension.enum';
import { AdMetricSnapshot } from './domain/ad-metric-snapshot';
import { ChannelEnum } from '../connections/domain/channel.enum';
import { ConnectionStatusEnum } from '../connections/domain/connection-status.enum';

const WEB_STALE_AFTER_MS = 26 * 60 * 60 * 1000;

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly snapshotsRepo: MetricSnapshotsRepository,
    private readonly postsRepo: PostsRepository,
    private readonly adMetricsRepo: AdMetricSnapshotsRepository,
    private readonly adCampaignsRepo: AdCampaignsRepository,
    private readonly webDimRepo: WebDimensionSnapshotsRepository,
    private readonly connectionsRepo: ConnectionsRepository,
  ) {}

  async getSocialOverview(
    brandId: number,
    connectionId: number,
    from: Date,
    to: Date,
  ) {
    const snapshots = await this.snapshotsRepo.findByConnectionAndRange(
      connectionId,
      brandId,
      from,
      to,
    );

    const rangeMs = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - rangeMs);
    const prevTo = new Date(from.getTime() - 1);
    const prevSnapshots = await this.snapshotsRepo.findByConnectionAndRange(
      connectionId,
      brandId,
      prevFrom,
      prevTo,
    );

    return {
      connectionId,
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
      series: this.buildSeries(snapshots),
      comparison: this.buildComparison(snapshots, prevSnapshots),
    };
  }

  async getTopPosts(
    brandId: number,
    connectionId: number,
    limit: number,
  ): Promise<Post[]> {
    return this.postsRepo.findTopByConnectionId(connectionId, brandId, limit);
  }

  async getSocialSummary(brandId: number, from: Date, to: Date) {
    const snapshots = await this.snapshotsRepo.findByBrandAndRange(
      brandId,
      from,
      to,
    );
    const topPosts = await this.postsRepo.findTopByBrandId(brandId, 5);

    const kpis: Record<string, number> = {};
    for (const s of snapshots) {
      if (!kpis[s.metric]) kpis[s.metric] = 0;
      kpis[s.metric] += s.value;
    }

    const followerSnapshots = snapshots.filter(
      (s) => s.metric === MetricEnum.followers,
    );
    if (followerSnapshots.length) {
      kpis[MetricEnum.followers] =
        followerSnapshots[followerSnapshots.length - 1].value;
    }

    return {
      brandId,
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
      kpis,
      topPosts,
    };
  }

  private buildSeries(
    snapshots: MetricSnapshot[],
  ): Record<string, { date: string; value: number }[]> {
    const series: Record<string, { date: string; value: number }[]> = {};
    for (const s of snapshots) {
      if (!series[s.metric]) series[s.metric] = [];
      series[s.metric].push({
        date: new Date(s.date).toISOString().slice(0, 10),
        value: s.value,
      });
    }
    return series;
  }

  async getAdsOverview(
    brandId: number,
    from: Date,
    to: Date,
    _compare?: boolean,
  ) {
    const snapshots = await this.adMetricsRepo.findByBrandAndDateRange(
      brandId,
      from,
      to,
    );
    const rangeMs = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - rangeMs);
    const prevTo = new Date(from.getTime() - 1);
    const prevSnapshots = await this.adMetricsRepo.findByBrandAndDateRange(
      brandId,
      prevFrom,
      prevTo,
    );

    const cur = this.aggregateAdMetrics(snapshots);
    const prev = this.aggregateAdMetrics(prevSnapshots);

    const kpis = [
      {
        label: 'Inversión',
        value: this.formatMoney(cur.spend),
        delta: this.deltaPct(cur.spend, prev.spend),
        spark: this.dailyValues(snapshots, 'spend'),
      },
      {
        label: 'ROAS',
        value: `${cur.roas.toFixed(1)}x`,
        delta: this.deltaPct(cur.roas, prev.roas),
        goodDown: false,
        spark: this.dailyValues(snapshots, 'spend'),
      },
      {
        label: 'Conversiones',
        value: this.formatNumber(cur.conversions),
        delta: this.deltaPct(cur.conversions, prev.conversions),
        spark: this.dailyValues(snapshots, 'conversions'),
      },
      {
        label: 'CPA',
        value: this.formatMoney(
          cur.conversions > 0 ? cur.spend / cur.conversions : 0,
        ),
        delta: this.deltaPct(
          cur.conversions > 0 ? cur.spend / cur.conversions : 0,
          prev.conversions > 0 ? prev.spend / prev.conversions : 0,
        ),
        goodDown: true,
        spark: this.dailyValues(snapshots, 'spend'),
      },
    ];

    const platforms = await this.buildAdsPlatforms(brandId, from, to);
    const spendTrend = this.buildSpendTrend(snapshots, from, to);

    const connection = await this.findAnyAdsConnection(brandId);
    const lastSyncAt = connection?.lastSyncAt ?? null;
    const stale = lastSyncAt
      ? Date.now() - new Date(lastSyncAt).getTime() > WEB_STALE_AFTER_MS
      : true;

    return {
      brandId,
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
      kpis,
      platforms,
      spendTrend,
      stale,
      lastSyncAt,
    };
  }

  async getAdsCampaigns(brandId: number, from: Date, to: Date) {
    const campaigns =
      await this.adCampaignsRepo.findByBrandAndConnection(brandId);

    const connections = await this.connectionsRepo.findByBrandId(brandId);
    const connById = new Map(connections.map((c) => [c.id, c]));

    const campaignMetrics = await Promise.all(
      campaigns.map(async (campaign) => {
        const metrics = await this.adMetricsRepo.findByCampaignAndDateRange(
          campaign.id,
          from,
          to,
        );
        const agg = this.aggregateAdMetrics(metrics);
        const conn = connById.get(campaign.connectionId);
        const platform = conn
          ? this.channelToUiKey(conn.channel)
          : 'googleads';
        return {
          name: campaign.name,
          platform,
          status: campaign.status,
          spend: this.formatMoney(agg.spend),
          roas: `${agg.roas.toFixed(1)}x`,
          conv: Math.round(agg.conversions),
          budget: this.budgetPct(campaign.budget, agg.spend),
        };
      }),
    );

    return {
      brandId,
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
      campaigns: campaignMetrics,
    };
  }

  private async buildAdsPlatforms(brandId: number, from: Date, to: Date) {
    const conns = await this.connectionsRepo.findByBrandId(brandId);
    const adsConns = conns.filter((c) =>
      [
        ChannelEnum.google_ads,
        ChannelEnum.meta_ads,
        ChannelEnum.tiktok_ads,
        ChannelEnum.linkedin_ads,
      ].includes(c.channel),
    );

    const platforms: Array<{
      ch: string;
      spend: string;
      roas: string;
      conv: number;
      cpa: string;
      pct: number;
    }> = [];

    let maxSpend = 0;

    for (const c of adsConns) {
      const campaigns =
        await this.adCampaignsRepo.findByBrandAndConnection(brandId, c.id);
      let agg = { spend: 0, conversions: 0, impressions: 0, clicks: 0 };
      for (const campaign of campaigns) {
        const snaps = await this.adMetricsRepo.findByCampaignAndDateRange(
          campaign.id,
          from,
          to,
        );
        const a = this.aggregateAdMetrics(snaps);
        agg.spend += a.spend;
        agg.conversions += a.conversions;
        agg.impressions += a.impressions;
        agg.clicks += a.clicks;
      }
      if (agg.spend > maxSpend) maxSpend = agg.spend;

      const roas = agg.spend > 0 ? agg.conversions / agg.spend : 0;
      const cpa = agg.conversions > 0 ? agg.spend / agg.conversions : 0;

      platforms.push({
        ch: this.channelToUiKey(c.channel),
        spend: this.formatMoney(agg.spend),
        roas: `${roas.toFixed(1)}x`,
        conv: Math.round(agg.conversions),
        cpa: this.formatMoney(cpa),
        pct: 0, // filled below
      });
    }

    return platforms.map((p) => ({
      ...p,
      pct: maxSpend > 0
        ? Math.round((this.parseMoney(p.spend) / maxSpend) * 100)
        : 0,
    }));
  }

  private buildSpendTrend(
    snapshots: AdMetricSnapshot[],
    from: Date,
    to: Date,
  ): number[] {
    const days: string[] = [];
    const cursor = new Date(from);
    while (cursor <= to) {
      days.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    const byDay = new Map<string, number>();
    for (const s of snapshots) {
      const k = new Date(s.date).toISOString().slice(0, 10);
      byDay.set(k, (byDay.get(k) ?? 0) + Number(s.spend ?? 0));
    }
    return days.map((d) => Math.round(byDay.get(d) ?? 0));
  }

  private dailyValues(
    snapshots: AdMetricSnapshot[],
    key: 'spend' | 'conversions',
  ): number[] {
    const byDay = new Map<string, number>();
    for (const s of snapshots) {
      const k = new Date(s.date).toISOString().slice(0, 10);
      byDay.set(k, (byDay.get(k) ?? 0) + Number(s[key] ?? 0));
    }
    return Array.from(byDay.values()).slice(-7);
  }

  private async findAnyAdsConnection(brandId: number) {
    const conns = await this.connectionsRepo.findByBrandId(brandId);
    return conns.find((c) =>
      [
        ChannelEnum.google_ads,
        ChannelEnum.meta_ads,
        ChannelEnum.tiktok_ads,
        ChannelEnum.linkedin_ads,
      ].includes(c.channel),
    );
  }

  private channelToUiKey(channel: ChannelEnum): string {
    if (channel === ChannelEnum.google_ads) return 'googleads';
    if (channel === ChannelEnum.meta_ads) return 'metaads';
    if (channel === ChannelEnum.tiktok_ads) return 'tiktokads';
    if (channel === ChannelEnum.linkedin_ads) return 'linkedinads';
    return channel;
  }

  private budgetPct(budget: number | undefined, spend: number): number {
    if (!budget || budget <= 0) return 0;
    return Math.min(100, Math.round((spend / budget) * 100));
  }

  private formatMoney(v: number): string {
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`;
    return `$${v.toFixed(2)}`;
  }

  private formatNumber(v: number): string {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
    return String(Math.round(v));
  }

  private parseMoney(s: string): number {
    const m = s.replace('$', '').replace('K', '');
    const n = parseFloat(m);
    return s.includes('K') ? n * 1000 : n;
  }

  private deltaPct(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  }

  async getWebOverview(
    brandId: number,
    from: Date,
    to: Date,
    cityFilter?: string,
  ) {
    const connection = await this.findActiveGa4Connection(brandId);
    if (!connection) {
      throw new NotFoundException('No GA4 connection for brand');
    }
    const connectionId = connection.id;

    const rangeMs = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - rangeMs);
    const prevTo = new Date(from.getTime() - 1);

    const [current, previous] = await Promise.all([
      this.snapshotsRepo.findByConnectionAndRange(
        connectionId,
        brandId,
        from,
        to,
      ),
      this.snapshotsRepo.findByConnectionAndRange(
        connectionId,
        brandId,
        prevFrom,
        prevTo,
      ),
    ]);

    const kpis = this.buildWebKpis(current, previous);
    const sessions = this.buildWebSessionsSeries(current, previous, from, to);

    const [sourcesAgg, devicesAgg, pagesAgg] = await Promise.all([
      this.webDimRepo.topByDimension(
        brandId,
        connectionId,
        WebDimensionEnum.source,
        from,
        to,
        10,
        cityFilter ? undefined : undefined,
      ),
      this.webDimRepo.topByDimension(
        brandId,
        connectionId,
        WebDimensionEnum.device,
        from,
        to,
        10,
      ),
      this.webDimRepo.topByDimension(
        brandId,
        connectionId,
        WebDimensionEnum.page,
        from,
        to,
        10,
      ),
    ]);

    const totalDeviceSessions = devicesAgg.reduce(
      (a, d) => a + d.sessions,
      0,
    ) || 1;

    const sources = sourcesAgg.map((a) => ({
      name: a.dimensionValue,
      sessions: a.sessions,
    }));
    const devices = devicesAgg.map((a) => ({
      name: a.dimensionValue,
      value: Math.round((a.sessions / totalDeviceSessions) * 100),
    }));
    const pages = pagesAgg.map((a) => ({
      path: a.dimensionValue,
      views: a.sessions,
      time: '—',
    }));

    const funnel = this.buildWebFunnel(kpis);

    const lastSyncAt = connection.lastSyncAt ?? null;
    const stale = lastSyncAt
      ? Date.now() - new Date(lastSyncAt).getTime() > WEB_STALE_AFTER_MS
      : true;

    return {
      brandId,
      connectionId,
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
      kpis,
      sessions,
      sources,
      pages,
      devices,
      funnel,
      stale,
      lastSyncAt,
    };
  }

  async listWebCities(
    brandId: number,
    from: Date,
    to: Date,
  ): Promise<string[]> {
    const connection = await this.findActiveGa4Connection(brandId);
    if (!connection) return [];
    return this.webDimRepo.listCities(brandId, connection.id, from, to);
  }

  private async findActiveGa4Connection(brandId: number) {
    const conns = await this.connectionsRepo.findByBrandId(brandId);
    return conns.find(
      (c) =>
        c.channel === ChannelEnum.ga4 &&
        c.status === ConnectionStatusEnum.connected,
    );
  }

  private buildWebKpis(current: MetricSnapshot[], previous: MetricSnapshot[]) {
    const cur = this.aggregateWeb(current);
    const prev = this.aggregateWeb(previous);

    const sessionsByDay = current
      .filter((s) => s.metric === MetricEnum.sessions)
      .map((s) => Number(s.value));
    const usersByDay = current
      .filter((s) => s.metric === MetricEnum.users)
      .map((s) => Number(s.value));

    const pagesPerSession = cur.sessions > 0 ? cur.pageViews / cur.sessions : 0;
    const prevPagesPerSession =
      prev.sessions > 0 ? prev.pageViews / prev.sessions : 0;
    const convRate = cur.sessions > 0 ? (cur.conversions / cur.sessions) * 100 : 0;
    const prevConvRate =
      prev.sessions > 0 ? (prev.conversions / prev.sessions) * 100 : 0;

    return [
      {
        label: 'Sesiones',
        value: Math.round(cur.sessions),
        delta: this.delta(cur.sessions, prev.sessions),
        spark: sessionsByDay,
      },
      {
        label: 'Usuarios',
        value: Math.round(cur.users),
        delta: this.delta(cur.users, prev.users),
        spark: usersByDay,
      },
      {
        label: 'Páginas / sesión',
        value: Number(pagesPerSession.toFixed(2)),
        delta: this.delta(pagesPerSession, prevPagesPerSession),
        spark: [],
      },
      {
        label: 'Tasa de conversión',
        value: Number(convRate.toFixed(2)),
        delta: this.delta(convRate, prevConvRate),
        spark: [],
      },
    ];
  }

  private buildWebSessionsSeries(
    current: MetricSnapshot[],
    previous: MetricSnapshot[],
    from: Date,
    to: Date,
  ) {
    const byDay = (snapshots: MetricSnapshot[]) => {
      const map = new Map<string, number>();
      for (const s of snapshots) {
        if (s.metric !== MetricEnum.sessions) continue;
        const key = new Date(s.date).toISOString().slice(0, 10);
        map.set(key, (map.get(key) ?? 0) + Number(s.value));
      }
      return map;
    };

    const curMap = byDay(current);
    const prevMap = byDay(previous);

    const days: string[] = [];
    const cursor = new Date(from);
    while (cursor <= to) {
      days.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    const curValues = days.map((d) => Math.round(curMap.get(d) ?? 0));
    const prevDays = Array.from(prevMap.keys()).sort();
    const prevValues = days.map((_, i) => {
      const k = prevDays[i];
      return k ? Math.round(prevMap.get(k) ?? 0) : 0;
    });
    const labels = days.map((d) => d.slice(5));

    return { current: curValues, previous: prevValues, labels };
  }

  private buildWebFunnel(kpis: Array<{ label: string; value: number }>) {
    const sessions = kpis.find((k) => k.label === 'Sesiones')?.value ?? 0;
    const convRate =
      kpis.find((k) => k.label === 'Tasa de conversión')?.value ?? 0;
    const conversions = Math.round((sessions * convRate) / 100);
    const engaged = Math.round(sessions * 0.45);

    return [
      { label: 'Visita', count: sessions, pct: 100 },
      {
        label: 'Sesión con engagement',
        count: engaged,
        pct: sessions > 0 ? Math.round((engaged / sessions) * 100) : 0,
      },
      {
        label: 'Conversión',
        count: conversions,
        pct: sessions > 0 ? Math.round((conversions / sessions) * 100) : 0,
      },
    ];
  }

  private aggregateWeb(snapshots: MetricSnapshot[]) {
    const sum = (m: MetricEnum) =>
      snapshots
        .filter((s) => s.metric === m)
        .reduce((a, s) => a + Number(s.value), 0);
    const avg = (m: MetricEnum) => {
      const rows = snapshots.filter((s) => s.metric === m);
      if (!rows.length) return 0;
      return rows.reduce((a, s) => a + Number(s.value), 0) / rows.length;
    };

    return {
      sessions: sum(MetricEnum.sessions),
      users: sum(MetricEnum.users),
      pageViews: sum(MetricEnum.page_views),
      conversions: sum(MetricEnum.conversions),
      bounceRate: avg(MetricEnum.bounce_rate),
      engagementRate: avg(MetricEnum.engagement_rate_pct),
      avgSessionDuration: avg(MetricEnum.avg_session_duration),
    };
  }

  private delta(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  }

  private aggregateAdMetrics(snapshots: AdMetricSnapshot[]) {
    const totals = {
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      cpc: 0,
      cpm: 0,
      roas: 0,
    };

    for (const s of snapshots) {
      totals.spend += s.spend;
      totals.impressions += s.impressions;
      totals.clicks += s.clicks;
      totals.conversions += s.conversions;
    }

    if (totals.impressions > 0) {
      totals.ctr = Number(
        ((totals.clicks / totals.impressions) * 100).toFixed(2),
      );
      totals.cpm = Number(
        (totals.spend / (totals.impressions / 1000)).toFixed(2),
      );
    }
    if (totals.clicks > 0) {
      totals.cpc = Number((totals.spend / totals.clicks).toFixed(4));
    }
    if (totals.spend > 0) {
      totals.roas = Number((totals.conversions / totals.spend).toFixed(2));
    }

    return totals;
  }

  private buildAdComparison(
    current: Record<string, number>,
    previous: Record<string, number>,
  ): Record<string, { current: number; previous: number; change: number }> {
    const result: Record<
      string,
      { current: number; previous: number; change: number }
    > = {};
    const metrics = [
      'spend',
      'impressions',
      'clicks',
      'conversions',
      'ctr',
      'cpc',
      'cpm',
      'roas',
    ];
    for (const metric of metrics) {
      const cur = current[metric] || 0;
      const prev = previous[metric] || 0;
      result[metric] = {
        current: cur,
        previous: prev,
        change:
          prev > 0 ? Math.round(((cur - prev) / prev) * 10000) / 100 : 0,
      };
    }
    return result;
  }

  private buildComparison(
    current: MetricSnapshot[],
    previous: MetricSnapshot[],
  ): Record<string, { current: number; previous: number; change: number }> {
    const sum = (arr: MetricSnapshot[], m: MetricEnum) =>
      arr.filter((s) => s.metric === m).reduce((acc, s) => acc + s.value, 0);

    const result: Record<
      string,
      { current: number; previous: number; change: number }
    > = {};

    const metrics = [...new Set(current.map((s) => s.metric))];
    for (const metric of metrics) {
      const cur = sum(current, metric as MetricEnum);
      const prev = sum(previous, metric as MetricEnum);
      result[metric] = {
        current: cur,
        previous: prev,
        change:
          prev > 0 ? Math.round(((cur - prev) / prev) * 10000) / 100 : 0,
      };
    }
    return result;
  }
}
