import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_REPORTS } from '../../queues/queue-names.constants';
import { ReportsRepository } from '../../reports/infrastructure/persistence/relational/repositories/reports.repository';
import { ReportBuilderService } from '../../reports/report-builder.service';
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
    private readonly builder: ReportBuilderService,
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
      const data = await this.builder.build(brandId, report.params);
      await this.reportsRepo.update(reportId, {
        data,
        status: ReportStatusEnum.ready,
        errorMessage: null,
      });
      const sections = data.sections.join(', ');
      this.logger.log(`Report #${reportId} ready (sections: ${sections})`);
    } catch (err) {
      this.logger.error(`Report #${reportId} failed`, err);
      await this.reportsRepo.updateStatus(reportId, ReportStatusEnum.failed, {
        errorMessage: (err as Error).message,
      });
    }
  }
}
