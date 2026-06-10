import { Injectable } from '@nestjs/common';
import { MetricSnapshotsRepository } from '../metrics/infrastructure/persistence/relational/repositories/metric-snapshots.repository';
import { PostsRepository } from '../metrics/infrastructure/persistence/relational/repositories/posts.repository';
import { AdMetricSnapshotsRepository } from './infrastructure/persistence/relational/repositories/ad-metric-snapshots.repository';
import { AdCampaignsRepository } from './infrastructure/persistence/relational/repositories/ad-campaigns.repository';
import { MetricSnapshot } from '../metrics/domain/metric-snapshot';
import { Post } from '../metrics/domain/post';
import { MetricEnum } from '../metrics/domain/metric.enum';
import { AdMetricSnapshot } from './domain/ad-metric-snapshot';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly snapshotsRepo: MetricSnapshotsRepository,
    private readonly postsRepo: PostsRepository,
    private readonly adMetricsRepo: AdMetricSnapshotsRepository,
    private readonly adCampaignsRepo: AdCampaignsRepository,
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

    // For followers we want the last value, not sum
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

  async getAdsOverview(brandId: number, from: Date, to: Date, compare?: boolean) {
    const snapshots = await this.adMetricsRepo.findByBrandAndDateRange(brandId, from, to);

    const aggregated = this.aggregateAdMetrics(snapshots);

    const result: any = {
      brandId,
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
      ...aggregated,
    };

    if (compare) {
      const rangeMs = to.getTime() - from.getTime();
      const prevFrom = new Date(from.getTime() - rangeMs);
      const prevTo = new Date(from.getTime() - 1);
      const prevSnapshots = await this.adMetricsRepo.findByBrandAndDateRange(
        brandId,
        prevFrom,
        prevTo,
      );
      const prevAggregated = this.aggregateAdMetrics(prevSnapshots);
      result.comparison = this.buildAdComparison(aggregated, prevAggregated);
    }

    return result;
  }

  async getAdsCampaigns(brandId: number, from: Date, to: Date) {
    const campaigns = await this.adCampaignsRepo.findByBrandAndConnection(brandId);

    const campaignMetrics = await Promise.all(
      campaigns.map(async (campaign) => {
        const metrics = await this.adMetricsRepo.findByCampaignAndDateRange(
          campaign.id,
          from,
          to,
        );
        const aggregated = this.aggregateAdMetrics(metrics);
        return {
          ...campaign,
          ...aggregated,
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

  async getWebOverview(brandId: number, from: Date, to: Date, compare?: boolean) {
    const snapshots = await this.snapshotsRepo.findByBrandAndRange(brandId, from, to);

    const webMetrics = snapshots.filter((s) =>
      ['sessions', 'conversions', 'bounce_rate', 'avg_session_duration'].includes(s.metric),
    );

    const aggregated = this.aggregateWebMetrics(webMetrics);

    const result: any = {
      brandId,
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
      ...aggregated,
    };

    if (compare) {
      const rangeMs = to.getTime() - from.getTime();
      const prevFrom = new Date(from.getTime() - rangeMs);
      const prevTo = new Date(from.getTime() - 1);
      const prevSnapshots = await this.snapshotsRepo.findByBrandAndRange(
        brandId,
        prevFrom,
        prevTo,
      );
      const prevWebMetrics = prevSnapshots.filter((s) =>
        ['sessions', 'conversions', 'bounce_rate', 'avg_session_duration'].includes(s.metric),
      );
      const prevAggregated = this.aggregateWebMetrics(prevWebMetrics);
      result.comparison = this.buildWebComparison(aggregated, prevAggregated);
    }

    return result;
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
      totals.ctr = Number(((totals.clicks / totals.impressions) * 100).toFixed(2));
      totals.cpm = Number((totals.spend / (totals.impressions / 1000)).toFixed(2));
    }
    if (totals.clicks > 0) {
      totals.cpc = Number((totals.spend / totals.clicks).toFixed(4));
    }
    if (totals.spend > 0) {
      totals.roas = Number((totals.conversions / totals.spend).toFixed(2));
    }

    return totals;
  }

  private aggregateWebMetrics(snapshots: MetricSnapshot[]) {
    const metrics: Record<string, number> = {};

    for (const s of snapshots) {
      if (!metrics[s.metric]) metrics[s.metric] = 0;
      metrics[s.metric] += s.value;
    }

    return {
      sessions: metrics['sessions'] || 0,
      conversions: metrics['conversions'] || 0,
      conversionRate:
        metrics['sessions'] > 0
          ? Number(((metrics['conversions'] / metrics['sessions']) * 100).toFixed(2))
          : 0,
    };
  }

  private buildAdComparison(
    current: any,
    previous: any,
  ): Record<string, { current: number; previous: number; change: number }> {
    const result: Record<string, { current: number; previous: number; change: number }> = {};

    const metrics = ['spend', 'impressions', 'clicks', 'conversions', 'ctr', 'cpc', 'cpm', 'roas'];
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

  private buildWebComparison(
    current: any,
    previous: any,
  ): Record<string, { current: number; previous: number; change: number }> {
    const result: Record<string, { current: number; previous: number; change: number }> = {};

    const metrics = ['sessions', 'conversions', 'conversionRate'];
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
        change: prev > 0 ? Math.round(((cur - prev) / prev) * 10000) / 100 : 0,
      };
    }
    return result;
  }
}
