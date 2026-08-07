import { aggregateSnapshotKpis, SnapshotLike } from './aggregate-snapshots';

// Mirrors the SNAPSHOT_METRICS set used by AnalyticsService.getSocialSummary.
const SNAPSHOT_METRICS = new Set([
  'followers',
  'following',
  'total_likes',
  'video_count',
]);

const snap = (
  connectionId: number,
  metric: string,
  date: string,
  value: number,
): SnapshotLike => ({ connectionId, metric, date, value });

describe('aggregateSnapshotKpis', () => {
  it('should sum the latest followers snapshot PER connection (regression: was global-latest)', () => {
    // Two connections, each with several daily follower snapshots.
    const snapshots = [
      snap(1, 'followers', '2026-06-01', 400),
      snap(1, 'followers', '2026-06-30', 500), // latest for conn 1
      snap(2, 'followers', '2026-06-15', 55000),
      snap(2, 'followers', '2026-06-30', 56000), // latest for conn 2
    ];
    const kpis = aggregateSnapshotKpis(snapshots, SNAPSHOT_METRICS);
    // Old (buggy) behaviour returned a single connection's value (500 or 56000);
    // correct behaviour sums the latest-per-connection.
    expect(kpis.followers).toBe(56500);
  });

  it('should sum additive metrics across all snapshots and connections', () => {
    const snapshots = [
      snap(1, 'reach', '2026-06-01', 1000),
      snap(1, 'reach', '2026-06-02', 1500),
      snap(2, 'reach', '2026-06-01', 2000),
      snap(1, 'engagement', '2026-06-01', 50),
      snap(2, 'engagement', '2026-06-01', 70),
    ];
    const kpis = aggregateSnapshotKpis(snapshots, SNAPSHOT_METRICS);
    expect(kpis.reach).toBe(4500);
    expect(kpis.engagement).toBe(120);
  });

  it('should mix additive and snapshot metrics correctly (Colchones-style brand)', () => {
    const snapshots = [
      // 3 pages with different follower counts (real bug had 62 vs 56k sum)
      snap(101, 'followers', '2026-06-30', 461),
      snap(92, 'followers', '2026-06-30', 51637),
      snap(95, 'followers', '2026-06-30', 62),
      // additive interactions across the brand
      snap(101, 'engagement', '2026-06-10', 4000),
      snap(92, 'engagement', '2026-06-11', 5680),
    ];
    const kpis = aggregateSnapshotKpis(snapshots, SNAPSHOT_METRICS);
    expect(kpis.followers).toBe(52160); // 461 + 51637 + 62
    expect(kpis.engagement).toBe(9680);
    // Engagement rate (interactions ÷ followers) is now sane, not 15000%+.
    expect((kpis.engagement / kpis.followers) * 100).toBeCloseTo(18.56, 1);
  });

  it('should handle a single connection (per-connection request) as that connection latest', () => {
    const snapshots = [
      snap(2, 'followers', '2026-06-01', 55000),
      snap(2, 'followers', '2026-06-30', 56000),
    ];
    const kpis = aggregateSnapshotKpis(snapshots, SNAPSHOT_METRICS);
    expect(kpis.followers).toBe(56000);
  });

  it('should return an empty object for no snapshots', () => {
    expect(aggregateSnapshotKpis([], SNAPSHOT_METRICS)).toEqual({});
  });
});
