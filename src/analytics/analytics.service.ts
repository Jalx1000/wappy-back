import { Injectable, NotFoundException } from '@nestjs/common';
import { MetricSnapshotsRepository } from '../metrics/infrastructure/persistence/relational/repositories/metric-snapshots.repository';
import { PostsRepository } from '../metrics/infrastructure/persistence/relational/repositories/posts.repository';
import { AdMetricSnapshotsRepository } from './infrastructure/persistence/relational/repositories/ad-metric-snapshots.repository';
import { AdCampaignsRepository } from './infrastructure/persistence/relational/repositories/ad-campaigns.repository';
import { WebDimensionSnapshotsRepository } from './infrastructure/persistence/relational/repositories/web-dimension-snapshots.repository';
import { ConnectionsRepository } from '../connections/infrastructure/persistence/relational/repositories/connections.repository';
import { BrandsService } from '../brands/brands.service';
import { MetricSnapshot } from '../metrics/domain/metric-snapshot';
import { Post } from '../metrics/domain/post';
import { MetricEnum } from '../metrics/domain/metric.enum';
import { WebDimensionEnum } from './domain/web-dimension.enum';
import { AdMetricSnapshot } from './domain/ad-metric-snapshot';
import { ChannelEnum } from '../connections/domain/channel.enum';
import { ConnectionStatusEnum } from '../connections/domain/connection-status.enum';
import { aggregateSnapshotKpis } from './aggregate-snapshots';

const WEB_STALE_AFTER_MS = 26 * 60 * 60 * 1000;

// Point-in-time social metrics: each row is a daily snapshot of a running
// total, not a per-day increment. They must be read as the latest value in a
// range, never summed (summing daily follower counts is meaningless).
const SNAPSHOT_METRICS = new Set<string>([
  MetricEnum.followers,
  MetricEnum.following,
  MetricEnum.total_likes,
  MetricEnum.video_count,
]);

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly snapshotsRepo: MetricSnapshotsRepository,
    private readonly postsRepo: PostsRepository,
    private readonly adMetricsRepo: AdMetricSnapshotsRepository,
    private readonly adCampaignsRepo: AdCampaignsRepository,
    private readonly webDimRepo: WebDimensionSnapshotsRepository,
    private readonly connectionsRepo: ConnectionsRepository,
    private readonly brandsService: BrandsService,
  ) {}

  // Cross-brand summary for the Marcas grid: last 30 days vs the 30 before.
  // Engagement uses the same interactions source and denominator as the social
  // analytics module so both screens report the same number.
  async getBrandsOverview() {
    const DAY = 24 * 60 * 60 * 1000;
    const to = new Date();
    const from = new Date(to.getTime() - 30 * DAY);
    const prevTo = new Date(from.getTime() - 1);
    const prevFrom = new Date(from.getTime() - 30 * DAY);

    const brands = await this.brandsService.findAll();

    return Promise.all(
      brands.map(async (brand) => {
        const [connections, members, social, prevSocial, ads, prevAds] =
          await Promise.all([
            this.connectionsRepo.findByBrandId(brand.id),
            this.brandsService.getMembers(brand.id),
            this.snapshotsRepo.findByBrandAndRange(brand.id, from, to),
            this.snapshotsRepo.findByBrandAndRange(brand.id, prevFrom, prevTo),
            this.adMetricsRepo.findByBrandAndDateRange(brand.id, from, to),
            this.adMetricsRepo.findByBrandAndDateRange(
              brand.id,
              prevFrom,
              prevTo,
            ),
          ]);

        const kpis = aggregateSnapshotKpis(social, SNAPSHOT_METRICS);
        const prevKpis = aggregateSnapshotKpis(prevSocial, SNAPSHOT_METRICS);
        const adsCur = this.aggregateAdMetrics(ads);
        const adsPrev = this.aggregateAdMetrics(prevAds);

        const followers = kpis[MetricEnum.followers] ?? 0;
        const reach = kpis[MetricEnum.reach] ?? 0;
        const interactions =
          kpis[MetricEnum.engagement] ??
          kpis[MetricEnum.total_interactions] ??
          0;
        const prevInteractions =
          prevKpis[MetricEnum.engagement] ??
          prevKpis[MetricEnum.total_interactions] ??
          0;
        const engBase = followers > 0 ? followers : reach;
        const engagementRate =
          engBase > 0 ? (interactions / engBase) * 100 : 0;

        // Headline delta for the card footer: first social metric with any
        // data in either period, falling back to ad spend for ads-only brands.
        const prevReach = prevKpis[MetricEnum.reach] ?? 0;
        let delta: {
          metric: 'reach' | 'interactions' | 'spend';
          pct: number;
        } | null = null;
        if (reach > 0 || prevReach > 0) {
          delta = { metric: 'reach', pct: this.deltaPct(reach, prevReach) };
        } else if (interactions > 0 || prevInteractions > 0) {
          delta = {
            metric: 'interactions',
            pct: this.deltaPct(interactions, prevInteractions),
          };
        } else if (adsCur.spend > 0 || adsPrev.spend > 0) {
          delta = {
            metric: 'spend',
            pct: this.deltaPct(adsCur.spend, adsPrev.spend),
          };
        }

        // expired/error connections are still linked accounts (they show as
        // "reauth" in the UI); only pending ones aren't real yet.
        const activeConnections = connections.filter(
          (c) => c.status !== ConnectionStatusEnum.pending,
        );
        const channels = [...new Set(activeConnections.map((c) => c.channel))];

        return {
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          description: brand.description,
          isActive: brand.isActive,
          logoPath: brand.logoPath,
          channels,
          connectionsCount: activeConnections.length,
          membersCount: members.length,
          metrics: {
            followers,
            reach,
            interactions,
            engagementRate: Number(engagementRate.toFixed(2)),
            spend: Number(adsCur.spend.toFixed(2)),
          },
          delta,
        };
      }),
    );
  }

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
    from?: Date,
    to?: Date,
  ): Promise<Post[]> {
    if (from && to) {
      return this.postsRepo.findTopByConnectionAndRange(
        connectionId,
        brandId,
        from,
        to,
        limit,
      );
    }
    return this.postsRepo.findTopByConnectionId(connectionId, brandId, limit);
  }

  async getSocialSummary(
    brandId: number,
    from: Date,
    to: Date,
    connectionId?: number,
  ) {
    const snapshots = connectionId
      ? await this.snapshotsRepo.findByConnectionAndRange(
          connectionId,
          brandId,
          from,
          to,
        )
      : await this.snapshotsRepo.findByBrandAndRange(brandId, from, to);
    const topPosts = connectionId
      ? await this.postsRepo.findTopByConnectionId(connectionId, brandId, 5)
      : await this.postsRepo.findTopByBrandId(brandId, 5);

    const kpis = aggregateSnapshotKpis(snapshots, SNAPSHOT_METRICS);

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

  async getAdsOverview(brandId: number, from: Date, to: Date) {
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

    const curCpa = cur.conversions > 0 ? cur.spend / cur.conversions : 0;
    const prevCpa = prev.conversions > 0 ? prev.spend / prev.conversions : 0;
    const kpis = [
      {
        label: 'Inversión',
        value: this.formatMoney(cur.spend),
        delta: this.deltaPct(cur.spend, prev.spend),
        spark: this.dailyValues(snapshots, 'spend'),
      },
      {
        label: 'Impresiones',
        value: this.formatNumber(cur.impressions),
        delta: this.deltaPct(cur.impressions, prev.impressions),
        spark: this.dailyValues(snapshots, 'impressions'),
      },
      {
        label: 'CPM',
        value: this.formatMoney(cur.cpm),
        delta: this.deltaPct(cur.cpm, prev.cpm),
        goodDown: true,
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
        value: this.formatMoney(curCpa),
        delta: this.deltaPct(curCpa, prevCpa),
        goodDown: true,
        spark: this.dailyValues(snapshots, 'spend'),
      },
      // Reach + frequency: only present once a provider that reports them
      // (TikTok/Meta Ads) has synced. Shown after the core spend KPIs.
      {
        label: 'Alcance',
        value: this.formatNumber(cur.reach),
        delta: this.deltaPct(cur.reach, prev.reach),
        spark: this.dailyValues(snapshots, 'reach'),
      },
      {
        label: 'Frecuencia',
        value: `${cur.frequency.toFixed(2)}x`,
        delta: this.deltaPct(cur.frequency, prev.frequency),
        spark: this.dailyValues(snapshots, 'impressions'),
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
      spendTrend: spendTrend.values,
      spendTrendLabels: spendTrend.labels,
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
        const platform = conn ? this.channelToUiKey(conn.channel) : 'googleads';
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
      const campaigns = await this.adCampaignsRepo.findByBrandAndConnection(
        brandId,
        c.id,
      );
      const agg = { spend: 0, conversions: 0, impressions: 0, clicks: 0 };
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
      pct:
        maxSpend > 0
          ? Math.round((this.parseMoney(p.spend) / maxSpend) * 100)
          : 0,
    }));
  }

  private buildSpendTrend(
    snapshots: AdMetricSnapshot[],
    from: Date,
    to: Date,
  ): { values: number[]; labels: string[] } {
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
    return {
      values: days.map((d) => Math.round(byDay.get(d) ?? 0)),
      labels: days.map((d) => d.slice(5)),
    };
  }

  private dailyValues(
    snapshots: AdMetricSnapshot[],
    key: 'spend' | 'conversions' | 'impressions' | 'reach',
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
    selectedConnectionId?: number,
  ) {
    const connection = await this.resolveGa4Connection(
      brandId,
      selectedConnectionId,
    );
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

    const totalDeviceSessions =
      devicesAgg.reduce((a, d) => a + d.sessions, 0) || 1;

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
    }));

    const webAgg = this.aggregateWeb(current);
    const funnel = this.buildWebFunnel(kpis, webAgg.engagementRate);

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
    connectionId?: number,
  ): Promise<string[]> {
    try {
      const connection = await this.resolveGa4Connection(brandId, connectionId);
      return this.webDimRepo.listCities(brandId, connection.id, from, to);
    } catch {
      return [];
    }
  }

  async getWebCountries(
    brandId: number,
    from: Date,
    to: Date,
    connectionId?: number,
  ) {
    const connection = await this.resolveGa4Connection(brandId, connectionId);
    const rows = await this.webDimRepo.topByDimension(
      brandId,
      connection.id,
      WebDimensionEnum.country,
      from,
      to,
      300,
    );
    return rows.map((r) => ({
      country: r.dimensionValue,
      sessions: r.sessions,
      users: r.users,
      conversions: r.conversions,
    }));
  }

  // Resolve which GA4 property/connection to read. With an explicit id we
  // validate it belongs to the brand; otherwise default to the most recently
  // synced connected GA4 so the default never lands on an empty property.
  private async resolveGa4Connection(brandId: number, connectionId?: number) {
    if (connectionId) {
      const conn = await this.connectionsRepo.findById(connectionId);
      if (
        !conn ||
        conn.brandId !== brandId ||
        conn.channel !== ChannelEnum.ga4
      ) {
        throw new NotFoundException('GA4 connection not found for brand');
      }
      return conn;
    }
    const conns = await this.connectionsRepo.findByBrandId(brandId);
    const ga4 = conns
      .filter(
        (c) =>
          c.channel === ChannelEnum.ga4 &&
          c.status === ConnectionStatusEnum.connected,
      )
      .sort(
        (a, b) =>
          (b.lastSyncAt ? new Date(b.lastSyncAt).getTime() : 0) -
          (a.lastSyncAt ? new Date(a.lastSyncAt).getTime() : 0),
      );
    if (!ga4.length) {
      throw new NotFoundException('No GA4 connection for brand');
    }
    return ga4[0];
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
    const convRate =
      cur.sessions > 0 ? (cur.conversions / cur.sessions) * 100 : 0;
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

  private buildWebFunnel(
    kpis: Array<{ label: string; value: number }>,
    engagementRate: number,
  ) {
    const sessions = kpis.find((k) => k.label === 'Sesiones')?.value ?? 0;
    const convRate =
      kpis.find((k) => k.label === 'Tasa de conversión')?.value ?? 0;
    const conversions = Math.round((sessions * convRate) / 100);
    const engaged = Math.round((sessions * engagementRate) / 100);

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
      reach: 0,
      frequency: 0,
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
      totals.reach += s.reach ?? 0;
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
    // Frequency = avg impressions per reached user. Derived from aggregates,
    // never summed (summing per-day frequency is meaningless).
    if (totals.reach > 0) {
      totals.frequency = Number(
        (totals.impressions / totals.reach).toFixed(2),
      );
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
        change: prev > 0 ? Math.round(((cur - prev) / prev) * 10000) / 100 : 0,
      };
    }
    return result;
  }

  private buildComparison(
    current: MetricSnapshot[],
    previous: MetricSnapshot[],
  ): Record<string, { current: number; previous: number; change: number }> {
    const valueOf = (arr: MetricSnapshot[], m: string) => {
      const rows = arr.filter((s) => s.metric === m);
      if (!rows.length) return 0;
      if (SNAPSHOT_METRICS.has(m)) {
        return rows.reduce((a, b) =>
          new Date(b.date).getTime() >= new Date(a.date).getTime() ? b : a,
        ).value;
      }
      return rows.reduce((acc, s) => acc + s.value, 0);
    };

    const result: Record<
      string,
      { current: number; previous: number; change: number }
    > = {};

    const metrics = [...new Set(current.map((s) => s.metric))];
    for (const metric of metrics) {
      const cur = valueOf(current, metric);
      const prev = valueOf(previous, metric);
      result[metric] = {
        current: cur,
        previous: prev,
        change: prev > 0 ? Math.round(((cur - prev) / prev) * 10000) / 100 : 0,
      };
    }
    return result;
  }
}
