import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  QUEUE_EMAILS,
  QUEUE_INSIGHTS,
  QUEUE_MENTIONS,
  QUEUE_REPORTS,
  QUEUE_SYNC_ADS,
  QUEUE_SYNC_SOCIAL,
  QUEUE_SYNC_WEB,
  QUEUE_TOKENS,
} from './queue-names.constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('WORKER_HOST', 'redis://redis:6379/1'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 500 },
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: QUEUE_SYNC_SOCIAL },
      { name: QUEUE_SYNC_ADS },
      { name: QUEUE_SYNC_WEB },
      { name: QUEUE_TOKENS },
      { name: QUEUE_REPORTS },
      { name: QUEUE_EMAILS },
      { name: QUEUE_MENTIONS },
      { name: QUEUE_INSIGHTS },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
