import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  QUEUE_SYNC_ADS,
  QUEUE_SYNC_SOCIAL,
  QUEUE_SYNC_WEB,
} from '../queues/queue-names.constants';

const TZ = 'America/La_Paz';

@Injectable()
export class WebSyncCronService implements OnApplicationBootstrap {
  private readonly logger = new Logger(WebSyncCronService.name);

  constructor(
    @InjectQueue(QUEUE_SYNC_WEB) private readonly webQueue: Queue,
    @InjectQueue(QUEUE_SYNC_ADS) private readonly adsQueue: Queue,
    @InjectQueue(QUEUE_SYNC_SOCIAL) private readonly socialQueue: Queue,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    // Web — 06:00 La Paz (close D-1) + 13:00 La Paz (refresh today)
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

    // Ads — same cadence (06:00 D-1, 13:00 today)
    await this.adsQueue.add(
      'ads-fanout-morning',
      { kind: 'fanout', window: 'yesterday' },
      {
        jobId: 'ads-fanout-morning',
        repeat: { pattern: '0 6 * * *', tz: TZ },
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 100 },
      },
    );
    await this.adsQueue.add(
      'ads-fanout-midday',
      { kind: 'fanout', window: 'today' },
      {
        jobId: 'ads-fanout-midday',
        repeat: { pattern: '0 13 * * *', tz: TZ },
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 100 },
      },
    );

    // Social — misma cadencia. Antes NO existía cron social: FB/IG/TikTok solo
    // sincronizaban en el backfill del OAuth o con el botón manual, y las
    // conexiones envejecían silenciosamente.
    await this.socialQueue.add(
      'social-fanout-morning',
      { kind: 'fanout', window: 'yesterday' },
      {
        jobId: 'social-fanout-morning',
        repeat: { pattern: '0 6 * * *', tz: TZ },
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 100 },
      },
    );
    await this.socialQueue.add(
      'social-fanout-midday',
      { kind: 'fanout', window: 'today' },
      {
        jobId: 'social-fanout-midday',
        repeat: { pattern: '0 13 * * *', tz: TZ },
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 100 },
      },
    );

    this.logger.log(
      `Web + Ads + Social daily sync registered: 06:00 + 13:00 ${TZ}`,
    );
  }
}
