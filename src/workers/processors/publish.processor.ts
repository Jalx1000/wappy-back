import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_PUBLISH } from '../../queues/queue-names.constants';
import { CalendarItemsRepository } from '../../calendar/infrastructure/persistence/relational/repositories/calendar-items.repository';
import { PublicationsService } from '../../publishing/publications.service';

@Processor(QUEUE_PUBLISH)
export class PublishProcessor extends WorkerHost {
  private readonly logger = new Logger(PublishProcessor.name);

  constructor(
    private readonly calendarRepo: CalendarItemsRepository,
    private readonly publications: PublicationsService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== 'publish-scan') return;

    const due = await this.calendarRepo.findDueScheduled(new Date());
    if (due.length === 0) return;
    this.logger.log(`Found ${due.length} scheduled publication(s) due`);

    for (const item of due) {
      const claimed = await this.calendarRepo.claimForPublishing(item.id);
      if (!claimed) continue;
      try {
        const result = await this.publications.publishCalendarItem(
          item.id,
          item.brandId,
        );
        this.logger.log(
          `Auto-published calendar item ${item.id}: ${result.status}`,
        );
      } catch (err) {
        this.logger.error(
          `Auto-publish failed for calendar item ${item.id}`,
          err as Error,
        );
        // publishCalendarItem only persists status on success/partial; on an
        // early throw (e.g. missing assetId) leave it as failed, not stuck.
        await this.calendarRepo.updateStatus(item.id, 'failed');
      }
    }
  }
}
