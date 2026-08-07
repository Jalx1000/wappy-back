import { Injectable, Logger } from '@nestjs/common';
import { BrandsRepository } from '../brands/infrastructure/persistence/relational/repositories/brands.repository';
import { ConnectionsRepository } from '../connections/infrastructure/persistence/relational/repositories/connections.repository';
import { MetricSnapshotsRepository } from '../metrics/infrastructure/persistence/relational/repositories/metric-snapshots.repository';
import { PostsRepository } from '../metrics/infrastructure/persistence/relational/repositories/posts.repository';
import { AdMetricSnapshotsRepository } from '../analytics/infrastructure/persistence/relational/repositories/ad-metric-snapshots.repository';
import { AdCampaignsRepository } from '../analytics/infrastructure/persistence/relational/repositories/ad-campaigns.repository';
import { WebDimensionSnapshotsRepository } from '../analytics/infrastructure/persistence/relational/repositories/web-dimension-snapshots.repository';
import { ChannelEnum } from '../connections/domain/channel.enum';
import { ConnectionStatusEnum } from '../connections/domain/connection-status.enum';
import { MetricEnum } from '../metrics/domain/metric.enum';
import { WebDimensionEnum } from '../analytics/domain/web-dimension.enum';
import { Connection } from '../connections/domain/connection';
import { MetricSnapshot } from '../metrics/domain/metric-snapshot';
import { Post } from '../metrics/domain/post';
import {
  ReportData,
  ReportKpi,
  ReportNetworkSection,
  ReportParams,
} from './domain/report';

const METRIC_LABELS: Partial<Record<MetricEnum, string>> = {
  [MetricEnum.reach]: 'Alcance',
  [MetricEnum.impressions]: 'Impresiones',
  [MetricEnum.video_views]: 'Reproducciones',
  [MetricEnum.engagement]: 'Interacciones',
  [MetricEnum.total_interactions]: 'Interacciones',
  [MetricEnum.followers]: 'Seguidores',
  [MetricEnum.new_follows]: 'Nuevos seguidores',
  [MetricEnum.likes]: 'Me gusta',
  [MetricEnum.comments]: 'Comentarios',
  [MetricEnum.shares]: 'Compartidos',
  [MetricEnum.saves]: 'Guardados',
  [MetricEnum.profile_views]: 'Visitas al perfil',
  [MetricEnum.sessions]: 'Sesiones',
  [MetricEnum.users]: 'Usuarios',
  [MetricEnum.conversions]: 'Conversiones',
  [MetricEnum.page_views]: 'Páginas vistas',
};

// Metrics shown per social network card, in display order. Followers is a
// snapshot (last value), the rest are summed over the period.
const SOCIAL_KPI_ORDER: MetricEnum[] = [
  MetricEnum.reach,
  MetricEnum.impressions,
  MetricEnum.video_views,
  MetricEnum.engagement,
  MetricEnum.likes,
  MetricEnum.comments,
  MetricEnum.followers,
];
const FOLLOWER_METRICS = new Set<MetricEnum>([MetricEnum.followers]);

interface NetworkFamily {
  label: string;
  channels: ChannelEnum[];
}
const NETWORK_FAMILIES: NetworkFamily[] = [
  { label: 'Facebook', channels: [ChannelEnum.facebook_page] },
  {
    label: 'Instagram',
    channels: [ChannelEnum.instagram, ChannelEnum.instagram_login],
  },
  { label: 'TikTok', channels: [ChannelEnum.tiktok] },
  { label: 'LinkedIn', channels: [ChannelEnum.linkedin] },
  { label: 'YouTube', channels: [ChannelEnum.youtube] },
];

@Injectable()
export class ReportBuilderService {
  private readonly logger = new Logger(ReportBuilderService.name);

  constructor(
    private readonly brandsRepo: BrandsRepository,
    private readonly connectionsRepo: ConnectionsRepository,
    private readonly snapshotsRepo: MetricSnapshotsRepository,
    private readonly postsRepo: PostsRepository,
    private readonly adMetricsRepo: AdMetricSnapshotsRepository,
    private readonly adCampaignsRepo: AdCampaignsRepository,
    private readonly webDimRepo: WebDimensionSnapshotsRepository,
  ) {}

  async build(brandId: number, params: ReportParams): Promise<ReportData> {
    const from = new Date(params.from);
    const to = new Date(params.to);
    const rangeMs = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - rangeMs);
    const prevTo = new Date(from.getTime() - 1);

    const wanted = this.resolveSections(params.sections);
    const brand = await this.brandsRepo.findByIdIncludingDeleted(brandId);
    const connections = (
      await this.connectionsRepo.findByBrandId(brandId)
    ).filter((c) => c.status === ConnectionStatusEnum.connected);

    const social = wanted.social
      ? await this.buildSocial(brandId, connections, from, to, prevFrom, prevTo)
      : undefined;
    const web = wanted.web
      ? await this.buildWeb(brandId, connections, from, to, prevFrom, prevTo)
      : undefined;
    const ads = wanted.ads
      ? await this.buildAds(brandId, from, to, prevFrom, prevTo)
      : undefined;

    const postsInRange = await this.postsRepo.findByBrandAndRange(
      brandId,
      from,
      to,
      undefined,
      500,
    );

    const executive = this.buildExecutive(social, web, ads, postsInRange);
    const conclusions = this.buildConclusions(social, web, ads);

    return {
      brand: { id: brandId, name: brand?.name ?? `Marca #${brandId}` },
      period: {
        from: params.from,
        to: params.to,
        label: this.periodLabel(from, to),
      },
      generatedAt: new Date().toISOString(),
      sections: Object.entries(wanted)
        .filter(([, v]) => v)
        .map(([k]) => k),
      executive,
      social: social && social.networks.length ? social : undefined,
      web,
      ads,
      conclusions,
    };
  }

  private resolveSections(sections?: string[]): {
    social: boolean;
    web: boolean;
    ads: boolean;
  } {
    if (!sections || !sections.length) {
      return { social: true, web: true, ads: true };
    }
    const norm = sections.map((s) => s.toLowerCase());
    const has = (...keys: string[]) =>
      norm.some((s) => keys.some((k) => s.includes(k)));
    return {
      social: has('social'),
      web: has('web', 'ga4'),
      ads: has('ads', 'paid', 'media'),
    };
  }

  // ---- Social --------------------------------------------------------------

  private async buildSocial(
    brandId: number,
    connections: Connection[],
    from: Date,
    to: Date,
    prevFrom: Date,
    prevTo: Date,
  ): Promise<{ networks: ReportNetworkSection[] }> {
    const networks: ReportNetworkSection[] = [];

    for (const family of NETWORK_FAMILIES) {
      const conns = connections.filter((c) =>
        family.channels.includes(c.channel),
      );
      if (!conns.length) continue;

      const curSnaps: MetricSnapshot[] = [];
      const prevSnaps: MetricSnapshot[] = [];
      const posts: Post[] = [];
      for (const c of conns) {
        curSnaps.push(
          ...(await this.snapshotsRepo.findByConnectionAndRange(
            c.id,
            brandId,
            from,
            to,
          )),
        );
        prevSnaps.push(
          ...(await this.snapshotsRepo.findByConnectionAndRange(
            c.id,
            brandId,
            prevFrom,
            prevTo,
          )),
        );
        posts.push(
          ...(await this.postsRepo.findTopByConnectionId(c.id, brandId, 6)),
        );
      }

      const curTotals = this.totalsByMetric(curSnaps);
      const prevTotals = this.totalsByMetric(prevSnaps);
      const series = this.seriesByMetric(curSnaps);

      const kpis: ReportKpi[] = [];
      for (const metric of SOCIAL_KPI_ORDER) {
        const value = curTotals.get(metric);
        if (value === undefined || value === 0) continue;
        kpis.push({
          key: metric,
          label: METRIC_LABELS[metric] ?? metric,
          value,
          unit: 'number',
          deltaPct: this.deltaPct(value, prevTotals.get(metric)),
          series: series.get(metric) ?? [],
        });
        if (kpis.length >= 6) break;
      }
      if (!kpis.length) continue;

      const topPosts = posts
        .sort(
          (a, b) => (b.metrics?.engagement ?? 0) - (a.metrics?.engagement ?? 0),
        )
        .slice(0, 6)
        .map((p) => ({
          externalId: p.externalId,
          channel: family.label,
          publishedAt: p.publishedAt,
          type: p.type,
          caption: p.caption,
          mediaUrl: p.mediaUrl,
          metrics: p.metrics ?? {},
        }));

      networks.push({
        channel: family.channels[0],
        label: family.label,
        handle: conns[0].accountHandle,
        kpis,
        topPosts,
        note: this.networkNote(family.label, kpis),
      });
    }

    return { networks };
  }

  private networkNote(label: string, kpis: ReportKpi[]): string {
    const reach = kpis.find((k) => k.key === MetricEnum.reach);
    const eng = kpis.find((k) => k.key === MetricEnum.engagement);
    const parts: string[] = [];
    if (reach?.deltaPct != null) {
      parts.push(
        `El alcance ${reach.deltaPct >= 0 ? 'creció' : 'cayó'} ${Math.abs(reach.deltaPct)}% respecto al período anterior.`,
      );
    }
    if (eng?.deltaPct != null) {
      parts.push(
        `Las interacciones ${eng.deltaPct >= 0 ? 'aumentaron' : 'disminuyeron'} ${Math.abs(eng.deltaPct)}%.`,
      );
    }
    return parts.join(' ') || `Resumen de desempeño en ${label}.`;
  }

  // ---- Web (GA4) -----------------------------------------------------------

  private async buildWeb(
    brandId: number,
    connections: Connection[],
    from: Date,
    to: Date,
    prevFrom: Date,
    prevTo: Date,
  ): Promise<ReportData['web']> {
    const ga4 = connections
      .filter((c) => c.channel === ChannelEnum.ga4)
      .sort(
        (a, b) =>
          (b.lastSyncAt ? new Date(b.lastSyncAt).getTime() : 0) -
          (a.lastSyncAt ? new Date(a.lastSyncAt).getTime() : 0),
      )[0];
    if (!ga4) return undefined;

    const cur = await this.snapshotsRepo.findByConnectionAndRange(
      ga4.id,
      brandId,
      from,
      to,
    );
    const prev = await this.snapshotsRepo.findByConnectionAndRange(
      ga4.id,
      brandId,
      prevFrom,
      prevTo,
    );
    if (!cur.length) return undefined;

    const curTotals = this.totalsByMetric(cur);
    const prevTotals = this.totalsByMetric(prev);
    const series = this.seriesByMetric(cur);

    const webMetrics = [
      MetricEnum.sessions,
      MetricEnum.users,
      MetricEnum.conversions,
      MetricEnum.page_views,
    ];
    const kpis: ReportKpi[] = [];
    for (const metric of webMetrics) {
      const value = curTotals.get(metric);
      if (value === undefined) continue;
      kpis.push({
        key: metric,
        label: METRIC_LABELS[metric] ?? metric,
        value,
        unit: 'number',
        deltaPct: this.deltaPct(value, prevTotals.get(metric)),
        series: series.get(metric) ?? [],
      });
    }

    const [sourcesAgg, countriesAgg, citiesAgg] = await Promise.all([
      this.webDimRepo.topByDimension(
        brandId,
        ga4.id,
        WebDimensionEnum.source,
        from,
        to,
        8,
      ),
      this.webDimRepo.topByDimension(
        brandId,
        ga4.id,
        WebDimensionEnum.country,
        from,
        to,
        200,
      ),
      this.webDimRepo.topByDimension(
        brandId,
        ga4.id,
        WebDimensionEnum.city,
        from,
        to,
        10,
      ),
    ]);

    return {
      kpis,
      sources: sourcesAgg.map((s) => ({
        label: s.dimensionValue,
        value: s.sessions,
      })),
      countries: countriesAgg.map((c) => ({
        country: c.dimensionValue,
        sessions: c.sessions,
        users: c.users,
        conversions: c.conversions,
      })),
      cities: citiesAgg.map((c) => ({
        city: c.dimensionValue,
        sessions: c.sessions,
      })),
    };
  }

  // ---- Ads -----------------------------------------------------------------

  private async buildAds(
    brandId: number,
    from: Date,
    to: Date,
    prevFrom: Date,
    prevTo: Date,
  ): Promise<ReportData['ads']> {
    const cur = await this.adMetricsRepo.findByBrandAndDateRange(
      brandId,
      from,
      to,
    );
    if (!cur.length) return undefined;
    const prev = await this.adMetricsRepo.findByBrandAndDateRange(
      brandId,
      prevFrom,
      prevTo,
    );

    const c = this.aggregateAds(cur);
    const p = this.aggregateAds(prev);
    const ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
    const prevCtr = p.impressions > 0 ? (p.clicks / p.impressions) * 100 : 0;

    const dailySpend = this.adDailySeries(cur, 'spend');
    const dailyConv = this.adDailySeries(cur, 'conversions');

    const kpis: ReportKpi[] = [
      {
        key: 'spend',
        label: 'Inversión',
        value: Math.round(c.spend),
        unit: 'currency',
        deltaPct: this.deltaPct(c.spend, p.spend),
        series: dailySpend,
      },
      {
        key: 'impressions',
        label: 'Impresiones',
        value: c.impressions,
        unit: 'number',
        deltaPct: this.deltaPct(c.impressions, p.impressions),
      },
      {
        key: 'clicks',
        label: 'Clics',
        value: c.clicks,
        unit: 'number',
        deltaPct: this.deltaPct(c.clicks, p.clicks),
      },
      {
        key: 'ctr',
        label: 'CTR',
        value: Number(ctr.toFixed(2)),
        unit: 'percent',
        deltaPct: this.deltaPct(ctr, prevCtr),
      },
      {
        key: 'conversions',
        label: 'Conversiones',
        value: Math.round(c.conversions),
        unit: 'number',
        deltaPct: this.deltaPct(c.conversions, p.conversions),
        series: dailyConv,
      },
    ];

    const campaignRows =
      await this.adCampaignsRepo.findByBrandAndConnection(brandId);
    const campaigns: Array<Record<string, string | number | null>> = [];
    for (const campaign of campaignRows) {
      const metrics = await this.adMetricsRepo.findByCampaignAndDateRange(
        campaign.id,
        from,
        to,
      );
      if (!metrics.length) continue;
      const agg = this.aggregateAds(metrics);
      campaigns.push({
        name: campaign.name,
        status: campaign.status ?? null,
        spend: Math.round(agg.spend),
        impressions: agg.impressions,
        clicks: agg.clicks,
        conversions: Math.round(agg.conversions),
        ctr:
          agg.impressions > 0
            ? Number(((agg.clicks / agg.impressions) * 100).toFixed(2))
            : 0,
      });
    }
    campaigns.sort((a, b) => Number(b.spend) - Number(a.spend));

    return { kpis, campaigns };
  }

  private aggregateAds(
    rows: {
      spend: number;
      impressions: number;
      clicks: number;
      conversions: number;
    }[],
  ) {
    return rows.reduce(
      (acc, r) => ({
        spend: acc.spend + Number(r.spend ?? 0),
        impressions: acc.impressions + Number(r.impressions ?? 0),
        clicks: acc.clicks + Number(r.clicks ?? 0),
        conversions: acc.conversions + Number(r.conversions ?? 0),
      }),
      { spend: 0, impressions: 0, clicks: 0, conversions: 0 },
    );
  }

  private adDailySeries(
    rows: { date: Date; spend: number; conversions: number }[],
    key: 'spend' | 'conversions',
  ): Array<{ date: string; value: number }> {
    const byDay = new Map<string, number>();
    for (const r of rows) {
      const d = new Date(r.date).toISOString().slice(0, 10);
      byDay.set(d, (byDay.get(d) ?? 0) + Number(r[key] ?? 0));
    }
    return [...byDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, value]) => ({ date, value: Math.round(value) }));
  }

  // ---- Executive + conclusions --------------------------------------------

  private buildExecutive(
    social: { networks: ReportNetworkSection[] } | undefined,
    web: ReportData['web'],
    ads: ReportData['ads'],
    posts: Post[],
  ): ReportData['executive'] {
    const kpis: ReportKpi[] = [];
    const sumNetworkMetric = (metric: MetricEnum) =>
      (social?.networks ?? []).reduce(
        (acc, n) => acc + (n.kpis.find((k) => k.key === metric)?.value ?? 0),
        0,
      );

    const totalReach = sumNetworkMetric(MetricEnum.reach);
    const totalEng = sumNetworkMetric(MetricEnum.engagement);
    const totalFollowers = sumNetworkMetric(MetricEnum.followers);
    if (posts.length)
      kpis.push({
        key: 'posts',
        label: 'Publicaciones',
        value: posts.length,
        unit: 'number',
      });
    if (totalReach)
      kpis.push({
        key: 'reach',
        label: 'Alcance total',
        value: totalReach,
        unit: 'number',
      });
    if (totalEng)
      kpis.push({
        key: 'engagement',
        label: 'Interacciones',
        value: totalEng,
        unit: 'number',
      });
    if (totalFollowers)
      kpis.push({
        key: 'followers',
        label: 'Seguidores',
        value: totalFollowers,
        unit: 'number',
      });
    if (web?.kpis.length) {
      const sessions = web.kpis.find((k) => k.key === MetricEnum.sessions);
      if (sessions) kpis.push({ ...sessions, label: 'Sesiones web' });
    }
    if (ads?.kpis.length) {
      const spend = ads.kpis.find((k) => k.key === 'spend');
      if (spend) kpis.push({ ...spend, label: 'Inversión ads' });
    }

    const byType = posts.reduce<Record<string, number>>((acc, p) => {
      const t = (p.type || 'post').toLowerCase();
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    }, {});
    const typeBreakdown = Object.entries(byType)
      .map(([t, n]) => `${n} ${t}`)
      .join(', ');

    const narrative: string[] = [];
    if (posts.length) {
      narrative.push(
        `Durante el período se publicaron ${posts.length} contenidos${typeBreakdown ? ` (${typeBreakdown})` : ''} en las redes de la marca.`,
      );
    }
    const networkLabels = (social?.networks ?? []).map((n) => n.label);
    if (networkLabels.length) {
      narrative.push(
        `Las plataformas activas en este informe son ${networkLabels.join(', ')}.`,
      );
    }
    if (totalReach) {
      narrative.push(
        `El alcance total consolidado fue de ${totalReach.toLocaleString('es-BO')} personas, con ${totalEng.toLocaleString('es-BO')} interacciones.`,
      );
    }
    if (web?.kpis.length) {
      const sessions = web.kpis.find((k) => k.key === MetricEnum.sessions);
      if (sessions)
        narrative.push(
          `El sitio web registró ${sessions.value.toLocaleString('es-BO')} sesiones en el período.`,
        );
    }
    if (ads?.kpis.length) {
      const spend = ads.kpis.find((k) => k.key === 'spend');
      const conv = ads.kpis.find((k) => k.key === 'conversions');
      if (spend)
        narrative.push(
          `La inversión publicitaria fue de $${spend.value.toLocaleString('es-BO')}${conv ? `, generando ${conv.value.toLocaleString('es-BO')} conversiones` : ''}.`,
        );
    }

    const postsTable = posts
      .slice()
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      )
      .slice(0, 30)
      .map((p) => ({
        fecha: new Date(p.publishedAt).toISOString().slice(0, 10),
        formato: p.type,
        alcance: p.metrics?.reach ?? 0,
        interacciones: p.metrics?.engagement ?? 0,
        likes: p.metrics?.likes ?? 0,
        comentarios: p.metrics?.comments ?? 0,
        compartidos: p.metrics?.shares ?? 0,
        guardados: p.metrics?.saves ?? 0,
      }));

    return { kpis, narrative, postsTable };
  }

  private buildConclusions(
    social: { networks: ReportNetworkSection[] } | undefined,
    web: ReportData['web'],
    ads: ReportData['ads'],
  ): string[] {
    const out: string[] = [];
    const reachDeltas = (social?.networks ?? [])
      .map((n) => n.kpis.find((k) => k.key === MetricEnum.reach)?.deltaPct)
      .filter((d): d is number => d != null);
    if (reachDeltas.length) {
      const avg = reachDeltas.reduce((a, b) => a + b, 0) / reachDeltas.length;
      out.push(
        avg >= 0
          ? `El alcance en redes sociales mostró una tendencia positiva (${avg.toFixed(1)}% promedio), reflejando un mayor interés de la audiencia.`
          : `El alcance en redes sociales descendió ${Math.abs(avg).toFixed(1)}% en promedio; se recomienda reforzar la pauta y la frecuencia de publicación.`,
      );
    }
    if (web?.kpis.length) {
      out.push(
        'El tráfico web complementa el desempeño en redes y refuerza los puntos de conversión de la marca.',
      );
    }
    if (ads?.kpis.length) {
      out.push(
        'La inversión en medios pagados contribuye al crecimiento; conviene optimizar las campañas de mejor retorno.',
      );
    }
    if (!out.length) {
      out.push(
        'No se registraron suficientes datos en el período para generar conclusiones detalladas.',
      );
    }
    return out;
  }

  // ---- helpers -------------------------------------------------------------

  private totalsByMetric(snaps: MetricSnapshot[]): Map<MetricEnum, number> {
    const totals = new Map<MetricEnum, number>();
    const lastFollower = new Map<string, { date: number; value: number }>();
    for (const s of snaps) {
      const metric = s.metric as MetricEnum;
      if (FOLLOWER_METRICS.has(metric)) {
        // Followers is a stock: take the most recent value per connection.
        const key = `${metric}:${s.connectionId}`;
        const t = new Date(s.date).getTime();
        const prev = lastFollower.get(key);
        if (!prev || t >= prev.date)
          lastFollower.set(key, { date: t, value: Number(s.value) });
        continue;
      }
      totals.set(metric, (totals.get(metric) ?? 0) + Number(s.value));
    }
    const followerSum = new Map<MetricEnum, number>();
    for (const [key, { value }] of lastFollower) {
      const metric = key.split(':')[0] as MetricEnum;
      followerSum.set(metric, (followerSum.get(metric) ?? 0) + value);
    }
    for (const [metric, value] of followerSum) totals.set(metric, value);
    return totals;
  }

  private seriesByMetric(
    snaps: MetricSnapshot[],
  ): Map<MetricEnum, Array<{ date: string; value: number }>> {
    const byMetric = new Map<MetricEnum, Map<string, number>>();
    for (const s of snaps) {
      const metric = s.metric as MetricEnum;
      const date = new Date(s.date).toISOString().slice(0, 10);
      if (!byMetric.has(metric)) byMetric.set(metric, new Map());
      const day = byMetric.get(metric)!;
      day.set(date, (day.get(date) ?? 0) + Number(s.value));
    }
    const out = new Map<MetricEnum, Array<{ date: string; value: number }>>();
    for (const [metric, day] of byMetric) {
      out.set(
        metric,
        [...day.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, value]) => ({ date, value })),
      );
    }
    return out;
  }

  private deltaPct(current: number, previous?: number): number | null {
    if (previous === undefined || previous === 0) return null;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  }

  private periodLabel(from: Date, to: Date): string {
    const fmt = new Intl.DateTimeFormat('es-BO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return `${fmt.format(from)} – ${fmt.format(to)}`;
  }
}
