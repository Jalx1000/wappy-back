import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue, UnrecoverableError } from 'bullmq';
import Redis from 'ioredis';
import { QUEUE_SYNC_ADS } from '../../queues/queue-names.constants';
import { ConnectionsRepository } from '../../connections/infrastructure/persistence/relational/repositories/connections.repository';
import { AdCampaignsRepository } from '../../analytics/infrastructure/persistence/relational/repositories/ad-campaigns.repository';
import { AdMetricSnapshotsRepository } from '../../analytics/infrastructure/persistence/relational/repositories/ad-metric-snapshots.repository';
import { EncryptionService } from '../../encryption/encryption.service';
import { GoogleAdsProvider } from '../../channel-providers/providers/google-ads/google-ads.provider';
import { MetaAdsProvider } from '../../channel-providers/providers/meta/meta-ads.provider';
import { TiktokAdsProvider } from '../../channel-providers/providers/tiktok-ads/tiktok-ads.provider';
import { LinkedinAdsProvider } from '../../channel-providers/providers/linkedin-ads/linkedin-ads.provider';
import { Connection } from '../../connections/domain/connection';
import { ChannelEnum } from '../../connections/domain/channel.enum';
import { ConnectionStatusEnum } from '../../connections/domain/connection-status.enum';

type AdsJobKind = 'sync' | 'fanout';
type FanoutWindow = 'yesterday' | 'today';

interface AdsJobPayload {
  brandId?: number;
  connectionId?: number;
  kind?: AdsJobKind;
  dateFrom?: string;
  dateTo?: string;
  window?: FanoutWindow;
}

const LOCK_TTL_SECONDS = 600;

@Processor(QUEUE_SYNC_ADS, {
  concurrency: 3,
  limiter: { max: 5, duration: 60_000 },
})
export class SyncAdsProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncAdsProcessor.name);
  private readonly redis: Redis;

  constructor(
    private readonly connectionsRepo: ConnectionsRepository,
    private readonly campaignsRepo: AdCampaignsRepository,
    private readonly adMetricsRepo: AdMetricSnapshotsRepository,
    private readonly encryption: EncryptionService,
    private readonly googleAds: GoogleAdsProvider,
    private readonly metaAds: MetaAdsProvider,
    private readonly tiktokAds: TiktokAdsProvider,
    private readonly linkedinAds: LinkedinAdsProvider,
    private readonly config: ConfigService,
    @InjectQueue(QUEUE_SYNC_ADS) private readonly adsQueue: Queue,
  ) {
    super();
    this.redis = new Redis(this.config.getOrThrow<string>('REDIS_URL'));
  }

  async process(job: Job<AdsJobPayload>): Promise<void> {
    const payload = job.data;
    const kind = payload.kind ?? 'sync';

    if (kind === 'fanout') {
      await this.runFanout(payload.window ?? 'yesterday');
      return;
    }

    const { brandId, connectionId, dateFrom, dateTo } = payload;
    if (!brandId || !connectionId || !dateFrom || !dateTo) {
      throw new UnrecoverableError(
        `sync-ads missing required fields for kind=${kind}`,
      );
    }

    const lockKey = `lock:sync-ads:${connectionId}`;
    this.logger.log(`sync-ads job ${job.id} conn=${connectionId}`);

    const lockAcquired = await this.redis.set(
      lockKey,
      '1',
      'EX',
      LOCK_TTL_SECONDS,
      'NX',
    );
    if (!lockAcquired) {
      this.logger.debug(`already running ${lockKey}, skip`);
      return;
    }

    try {
      const connection = await this.connectionsRepo.findById(connectionId);
      if (!connection || connection.brandId !== brandId) {
        throw new UnrecoverableError(`connection ${connectionId} not found`);
      }

      const decrypted = this.decryptTokens(connection);
      const from = new Date(dateFrom);
      const to = new Date(dateTo);

      if (connection.channel === ChannelEnum.google_ads) {
        await this.runWithProvider(this.googleAds, decrypted, from, to);
      } else if (connection.channel === ChannelEnum.meta_ads) {
        await this.runWithProvider(this.metaAds, decrypted, from, to);
      } else if (connection.channel === ChannelEnum.tiktok_ads) {
        await this.runWithProvider(this.tiktokAds, decrypted, from, to);
      } else if (connection.channel === ChannelEnum.linkedin_ads) {
        await this.runWithProvider(this.linkedinAds, decrypted, from, to);
      } else {
        throw new UnrecoverableError(
          `sync-ads: channel ${connection.channel} not supported yet`,
        );
      }

      await this.connectionsRepo.updateStatus(
        connectionId,
        ConnectionStatusEnum.connected,
        new Date(),
      );
      this.logger.log(`sync-ads OK conn=${connectionId}`);
    } catch (err) {
      if (err instanceof UnrecoverableError) {
        await this.connectionsRepo.updateStatus(
          connectionId,
          ConnectionStatusEnum.error,
        );
      }
      this.logger.error(`sync-ads FAIL conn=${connectionId}`, err as Error);
      throw err;
    } finally {
      await this.redis.del(lockKey);
    }
  }

  private async runWithProvider(
    provider:
      | GoogleAdsProvider
      | MetaAdsProvider
      | TiktokAdsProvider
      | LinkedinAdsProvider,
    connection: Connection,
    from: Date,
    to: Date,
  ) {
    const result = await provider.fetchAdData(connection, { from, to });

    // Upsert campaigns: lookup by (brandId, externalId)
    const externalToId = new Map<string, number>();
    for (const campaign of result.campaigns) {
      const existing = await this.campaignsRepo.findByBrandAndExternalId(
        campaign.brandId,
        campaign.externalId,
      );
      if (existing) {
        existing.name = campaign.name;
        existing.status = campaign.status;
        existing.objective = campaign.objective;
        existing.currency = campaign.currency;
        const saved = await this.campaignsRepo.save(existing);
        externalToId.set(campaign.externalId, saved.id);
      } else {
        const saved = await this.campaignsRepo.save(campaign);
        externalToId.set(campaign.externalId, saved.id);
      }
    }

    // Attach campaignId to snapshots
    const ready = result.snapshots
      .map((s) => {
        const ext = (s as unknown as { _externalId?: string })._externalId;
        if (!ext) return null;
        const id = externalToId.get(ext);
        if (!id) return null;
        s.campaignId = id;
        delete (s as unknown as { _externalId?: string })._externalId;
        return s;
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    await this.adMetricsRepo.upsertMany(ready);
  }

  private async runFanout(window: FanoutWindow): Promise<void> {
    const adsChannels: ChannelEnum[] = [
      ChannelEnum.google_ads,
      ChannelEnum.meta_ads,
      ChannelEnum.tiktok_ads,
      ChannelEnum.linkedin_ads,
    ];

    const connections = (
      await Promise.all(
        adsChannels.map((ch) =>
          this.connectionsRepo.findConnectedByChannel(ch),
        ),
      )
    ).flat();

    if (!connections.length) {
      this.logger.log('ads fanout: no active connections');
      return;
    }

    const { from, to } = this.buildRange(window);
    const fromIso = from.toISOString();
    const toIso = to.toISOString();
    const stamp = this.stamp(window);

    for (const conn of connections) {
      await this.adsQueue.add(
        'ads-sync',
        {
          brandId: conn.brandId,
          connectionId: conn.id,
          kind: 'sync',
          dateFrom: fromIso,
          dateTo: toIso,
        },
        { jobId: `ads-${conn.id}-${stamp}` },
      );
    }
    this.logger.log(
      `ads fanout window=${window} encoladas=${connections.length}`,
    );
  }

  private buildRange(window: FanoutWindow): { from: Date; to: Date } {
    const now = new Date();
    const startToday = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    );
    if (window === 'today') {
      return { from: new Date(startToday), to: now };
    }
    return {
      from: new Date(startToday - 24 * 60 * 60 * 1000),
      to: new Date(startToday - 1),
    };
  }

  private stamp(window: FanoutWindow): string {
    const d = new Date();
    const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(
      d.getUTCDate(),
    ).padStart(2, '0')}`;
    return `${window}-${ymd}`;
  }

  private decryptTokens(connection: Connection): Connection {
    const decrypted = Object.assign(new Connection(), connection);
    try {
      decrypted.accessToken = this.encryption.decrypt(connection.accessToken);
    } catch {
      decrypted.accessToken = connection.accessToken;
    }
    if (connection.refreshToken) {
      try {
        decrypted.refreshToken = this.encryption.decrypt(
          connection.refreshToken,
        );
      } catch {
        decrypted.refreshToken = connection.refreshToken;
      }
    }
    return decrypted;
  }
}
