import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { QUEUE_REPORTS } from '../../queues/queue-names.constants';
import { ReportsRepository } from '../../reports/infrastructure/persistence/relational/repositories/reports.repository';
import { ReportSchedulesRepository } from '../../reports/infrastructure/persistence/relational/repositories/report-schedules.repository';
import { ReportBuilderService } from '../../reports/report-builder.service';
import { ReportPdfService } from '../../reports/report-pdf.service';
import { ReportEmailService } from '../../reports/report-email.service';
import { ReportStatusEnum } from '../../reports/domain/report-status.enum';
import { ReportTypeEnum } from '../../reports/domain/report-type.enum';
import {
  computeNextRun,
  periodForFrequency,
} from '../../reports/schedule-time.util';

interface ReportJobPayload {
  reportId?: number;
  brandId?: number;
  scheduleId?: number;
}

@Processor(QUEUE_REPORTS)
export class ReportProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportProcessor.name);

  constructor(
    private readonly reportsRepo: ReportsRepository,
    private readonly schedulesRepo: ReportSchedulesRepository,
    private readonly builder: ReportBuilderService,
    private readonly pdfService: ReportPdfService,
    private readonly emailService: ReportEmailService,
    @InjectQueue(QUEUE_REPORTS) private readonly queue: Queue,
  ) {
    super();
  }

  async process(job: Job<ReportJobPayload>): Promise<void> {
    switch (job.name) {
      case 'scan-schedules':
        return this.scanSchedules();
      case 'send-scheduled-report':
        return this.sendScheduled(job.data.scheduleId!);
      case 'generate-report':
      default:
        return this.generate(job.data.reportId!, job.data.brandId!);
    }
  }

  private async generate(reportId: number, brandId: number): Promise<void> {
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
      this.logger.log(
        `Report #${reportId} ready (sections: ${data.sections.join(', ')})`,
      );
    } catch (err) {
      this.logger.error(`Report #${reportId} failed`, err);
      await this.reportsRepo.updateStatus(reportId, ReportStatusEnum.failed, {
        errorMessage: (err as Error).message,
      });
    }
  }

  // Find schedules due now and fan out one send job per schedule.
  private async scanSchedules(): Promise<void> {
    const due = await this.schedulesRepo.findDue(new Date());
    if (!due.length) return;
    this.logger.log(`Report schedule scan: ${due.length} due`);
    for (const s of due) {
      await this.queue.add(
        'send-scheduled-report',
        { scheduleId: s.id },
        {
          jobId: `sched-${s.id}-${Date.now()}`,
          removeOnComplete: { count: 50 },
          removeOnFail: { count: 200 },
        },
      );
    }
  }

  private async sendScheduled(scheduleId: number): Promise<void> {
    const schedule = await this.schedulesRepo.findById(scheduleId);
    if (!schedule || !schedule.enabled) {
      this.logger.warn(`Schedule #${scheduleId} missing/disabled, skipping`);
      return;
    }
    this.logger.log(
      `Sending scheduled report for schedule #${scheduleId} (brand #${schedule.brandId})`,
    );
    try {
      const period = periodForFrequency(schedule.frequency);
      // Create a Report row so it's viewable in-app and gives the email link.
      const report = await this.reportsRepo.create({
        brandId: schedule.brandId,
        type: ReportTypeEnum.summary,
        status: ReportStatusEnum.processing,
        params: {
          from: period.from,
          to: period.to,
          sections: schedule.sections,
        },
        fileUrl: null,
        data: null,
        errorMessage: null,
      });

      const data = await this.builder.build(schedule.brandId, report.params);
      await this.reportsRepo.update(report.id, {
        data,
        status: ReportStatusEnum.ready,
        errorMessage: null,
      });

      const pdf = await this.pdfService.build(data);
      const recipients = await this.emailService.resolveRecipients(
        schedule.memberUserIds,
        schedule.extraEmails,
      );
      await this.emailService.sendReport({
        to: recipients,
        reportId: report.id,
        data,
        pdf,
      });

      const now = new Date();
      await this.schedulesRepo.update(scheduleId, {
        lastRunAt: now,
        nextRunAt: computeNextRun({ ...schedule, lastRunAt: now }, now),
      });
      this.logger.log(
        `Schedule #${scheduleId} sent (report #${report.id}, ${recipients.length} recipients)`,
      );
    } catch (err) {
      this.logger.error(`Schedule #${scheduleId} send failed`, err);
      // Still advance nextRunAt so a single failure doesn't retrigger every hour.
      const now = new Date();
      await this.schedulesRepo.update(scheduleId, {
        nextRunAt: computeNextRun({ ...schedule, lastRunAt: now }, now),
      });
    }
  }
}
