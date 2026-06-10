import { Injectable } from '@nestjs/common';
import { MetricSnapshotsRepository } from '../metrics/infrastructure/persistence/relational/repositories/metric-snapshots.repository';
import { PostsRepository } from '../metrics/infrastructure/persistence/relational/repositories/posts.repository';
import { MetricSnapshot } from '../metrics/domain/metric-snapshot';
import { Post } from '../metrics/domain/post';
import { MetricEnum } from '../metrics/domain/metric.enum';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly snapshotsRepo: MetricSnapshotsRepository,
    private readonly postsRepo: PostsRepository,
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
