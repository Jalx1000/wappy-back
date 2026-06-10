import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_TOKENS } from '../queues/queue-names.constants';

@Injectable()
export class TokenRefreshCronService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TokenRefreshCronService.name);

  constructor(@InjectQueue(QUEUE_TOKENS) private readonly tokenQueue: Queue) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.tokenQueue.add(
      'token-refresh-cron',
      {},
      {
        jobId: 'token-refresh-cron',
        repeat: { pattern: '0 * * * *' },
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 100 },
      },
    );
    this.logger.log('Token refresh repeatable job registered (hourly)');
  }
}
