// Pure aggregation for brand-level social KPIs, extracted from AnalyticsService
// so it can be unit-tested without the repository/TypeORM graph.
// See aggregate-snapshots.spec.ts.

export interface SnapshotLike {
  connectionId: number;
  date: Date | string;
  metric: string;
  value: number;
}

// Additive metrics (reach, impressions, engagement, likes, …) are summed across
// every snapshot in the range. Point-in-time snapshot metrics (followers,
// following, total_likes, video_count) are running totals, not increments, so
// we keep the latest snapshot PER CONNECTION and then sum across connections —
// a brand's followers is the total of all its pages/accounts, not just whichever
// connection synced last. For a single-connection range this equals that
// connection's latest value.
export function aggregateSnapshotKpis(
  snapshots: SnapshotLike[],
  snapshotMetrics: Set<string>,
): Record<string, number> {
  const kpis: Record<string, number> = {};
  const latestPerConn: Record<string, { t: number; value: number }> = {};
  for (const s of snapshots) {
    if (snapshotMetrics.has(s.metric)) {
      const key = `${s.metric}|${s.connectionId}`;
      const t = new Date(s.date).getTime();
      if (!latestPerConn[key] || t >= latestPerConn[key].t) {
        latestPerConn[key] = { t, value: s.value };
      }
    } else {
      kpis[s.metric] = (kpis[s.metric] ?? 0) + s.value;
    }
  }
  for (const [key, { value }] of Object.entries(latestPerConn)) {
    const metric = key.slice(0, key.indexOf('|'));
    kpis[metric] = (kpis[metric] ?? 0) + value;
  }
  return kpis;
}
