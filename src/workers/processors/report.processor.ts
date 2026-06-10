import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as fs from 'fs';
import * as path from 'path';
import { QUEUE_REPORTS } from '../../queues/queue-names.constants';
import { ReportsRepository } from '../../reports/infrastructure/persistence/relational/repositories/reports.repository';
import { MetricSnapshotsRepository } from '../../metrics/infrastructure/persistence/relational/repositories/metric-snapshots.repository';
import { PostsRepository } from '../../metrics/infrastructure/persistence/relational/repositories/posts.repository';
import { MetricSnapshot } from '../../metrics/domain/metric-snapshot';
import { Post } from '../../metrics/domain/post';
import { ReportStatusEnum } from '../../reports/domain/report-status.enum';

interface ReportJobPayload {
  reportId: number;
  brandId: number;
}

@Processor(QUEUE_REPORTS)
export class ReportProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportProcessor.name);

  constructor(
    private readonly reportsRepo: ReportsRepository,
    private readonly snapshotsRepo: MetricSnapshotsRepository,
    private readonly postsRepo: PostsRepository,
  ) {
    super();
  }

  async process(job: Job<ReportJobPayload>): Promise<void> {
    const { reportId, brandId } = job.data;
    this.logger.log(`Generating report #${reportId} for brand #${brandId}`);

    const report = await this.reportsRepo.findById(reportId);
    if (!report) {
      this.logger.warn(`Report #${reportId} not found, skipping`);
      return;
    }

    await this.reportsRepo.updateStatus(reportId, ReportStatusEnum.processing);

    try {
      const from = new Date(report.params.from);
      const to = new Date(report.params.to);

      const snapshots = await this.snapshotsRepo.findByBrandAndRange(brandId, from, to);
      const posts = await this.postsRepo.findByBrandAndRange(brandId, from, to);

      const reportData = {
        reportId,
        brandId,
        type: report.type,
        period: { from: report.params.from, to: report.params.to },
        summary: this.aggregateMetrics(snapshots),
        posts: posts.map((p: Post) => ({
          externalId: p.externalId,
          publishedAt: p.publishedAt,
          type: p.type,
          caption: p.caption,
          metrics: p.metrics,
        })),
        generatedAt: new Date().toISOString(),
      };

      const dir = '/tmp/reports';
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const filePath = path.join(dir, `${reportId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(reportData, null, 2), 'utf8');

      await this.reportsRepo.updateStatus(reportId, ReportStatusEnum.ready, {
        fileUrl: filePath,
      });
      this.logger.log(`Report #${reportId} ready at ${filePath}`);
    } catch (err) {
      this.logger.error(`Report #${reportId} failed`, err);
      await this.reportsRepo.updateStatus(reportId, ReportStatusEnum.failed, {
        errorMessage: (err as Error).message,
      });
    }
  }

  private aggregateMetrics(
    snapshots: MetricSnapshot[],
  ): Record<string, { total: number; avg: number; count: number }> {
    const grouped = new Map<string, number[]>();
    for (const s of snapshots) {
      const arr = grouped.get(s.metric) ?? [];
      arr.push(Number(s.value));
      grouped.set(s.metric, arr);
    }
    const result: Record<string, { total: number; avg: number; count: number }> = {};
    for (const [metric, values] of grouped) {
      const total = values.reduce((a, b) => a + b, 0);
      result[metric] = { total, avg: total / values.length, count: values.length };
    }
    return result;
  }
}
