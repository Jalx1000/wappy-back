import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_PUBLISH } from '../queues/queue-names.constants';

@Injectable()
export class PublishScheduleCronService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PublishScheduleCronService.name);

  constructor(@InjectQueue(QUEUE_PUBLISH) private readonly queue: Queue) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.queue.add(
      'publish-scan',
      {},
      {
        jobId: 'publish-scan',
        repeat: { pattern: '* * * * *' },
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 100 },
      },
    );
    this.logger.log('Publish schedule scan registered (every minute)');
  }
}
