import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_REPORTS } from '../queues/queue-names.constants';

const TZ = 'America/La_Paz';

@Injectable()
export class ReportScheduleCronService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ReportScheduleCronService.name);

  constructor(
    @InjectQueue(QUEUE_REPORTS) private readonly reportsQueue: Queue,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    // Hourly scan that dispatches any report schedule whose nextRunAt has passed.
    await this.reportsQueue.add(
      'scan-schedules',
      { kind: 'scan' },
      {
        jobId: 'report-schedule-scan',
        repeat: { pattern: '0 * * * *', tz: TZ },
        removeOnComplete: { count: 20 },
        removeOnFail: { count: 100 },
      },
    );
    this.logger.log(`Report schedule scan registered: hourly ${TZ}`);
  }
}
