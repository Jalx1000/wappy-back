import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_TOKENS } from '../queues/queue-names.constants';

@Injectable()
export class DiscoveryCleanupCronService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DiscoveryCleanupCronService.name);

  constructor(@InjectQueue(QUEUE_TOKENS) private readonly queue: Queue) {}

  async onApplicationBootstrap(): Promise<void> {
    // Piggyback on QUEUE_TOKENS (already exists). Fired every 6 hours.
    await this.queue.add(
      'discovery-cleanup',
      {},
      {
        jobId: 'discovery-cleanup',
        repeat: { pattern: '0 */6 * * *' },
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 50 },
      },
    );
    this.logger.log('Discovery cleanup repeatable job registered (every 6h)');
  }
}
