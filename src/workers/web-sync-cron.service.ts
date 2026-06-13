import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_SYNC_WEB } from '../queues/queue-names.constants';

const TZ = 'America/La_Paz';

@Injectable()
export class WebSyncCronService implements OnApplicationBootstrap {
  private readonly logger = new Logger(WebSyncCronService.name);

  constructor(@InjectQueue(QUEUE_SYNC_WEB) private readonly webQueue: Queue) {}

  async onApplicationBootstrap(): Promise<void> {
    // 06:00 La Paz — close yesterday's window with final GA4 numbers
    await this.webQueue.add(
      'web-fanout-morning',
      { kind: 'fanout', window: 'yesterday' },
      {
        jobId: 'web-fanout-morning',
        repeat: { pattern: '0 6 * * *', tz: TZ },
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 100 },
      },
    );

    // 13:00 La Paz — refresh today's partial data
    await this.webQueue.add(
      'web-fanout-midday',
      { kind: 'fanout', window: 'today' },
      {
        jobId: 'web-fanout-midday',
        repeat: { pattern: '0 13 * * *', tz: TZ },
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 100 },
      },
    );

    this.logger.log(
      `GA4 daily sync registered: 06:00 (yesterday) + 13:00 (today) ${TZ}`,
    );
  }
}
