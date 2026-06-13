import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue, UnrecoverableError } from 'bullmq';
import Redis from 'ioredis';
import { QUEUE_SYNC_WEB } from '../../queues/queue-names.constants';
import { ConnectionsRepository } from '../../connections/infrastructure/persistence/relational/repositories/connections.repository';
import { MetricSnapshotsRepository } from '../../metrics/infrastructure/persistence/relational/repositories/metric-snapshots.repository';
import { WebDimensionSnapshotsRepository } from '../../analytics/infrastructure/persistence/relational/repositories/web-dimension-snapshots.repository';
import { EncryptionService } from '../../encryption/encryption.service';
import { Ga4Provider } from '../../channel-providers/providers/ga4/ga4.provider';
import { Connection } from '../../connections/domain/connection';
import { ChannelEnum } from '../../connections/domain/channel.enum';
import { ConnectionStatusEnum } from '../../connections/domain/connection-status.enum';
import { MetricSnapshot } from '../../metrics/domain/metric-snapshot';
import { MetricEnum } from '../../metrics/domain/metric.enum';
import { WebDimensionEnum } from '../../analytics/domain/web-dimension.enum';
import { WebDimensionSnapshot } from '../../analytics/domain/web-dimension-snapshot';

type WebJobKind = 'kpi' | 'breakdown' | 'fanout';
type FanoutWindow = 'yesterday' | 'today';

interface WebJobPayload {
  brandId?: number;
  connectionId?: number;
  kind: WebJobKind;
  dimension?: WebDimensionEnum;
  dateFrom?: string;
  dateTo?: string;
  window?: FanoutWindow;
}

const WEB_DIMENSIONS_TO_FAN: WebDimensionEnum[] = [
  WebDimensionEnum.source,
  WebDimensionEnum.device,
  WebDimensionEnum.page,
  WebDimensionEnum.country,
  WebDimensionEnum.city,
];

const LOCK_TTL_SECONDS = 600;

// GA4 rate limit: 10k req/day per Cloud project. 5 jobs/min globally
// keeps headroom for spikes (5/min × 60min × 24h = 7200/day max).
@Processor(QUEUE_SYNC_WEB, {
  concurrency: 3,
  limiter: { max: 5, duration: 60_000 },
})
export class SyncWebProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncWebProcessor.name);
  private readonly redis: Redis;

  constructor(
    private readonly connectionsRepo: ConnectionsRepository,
    private readonly metricsRepo: MetricSnapshotsRepository,
    private readonly webDimRepo: WebDimensionSnapshotsRepository,
    private readonly encryption: EncryptionService,
    private readonly ga4Provider: Ga4Provider,
    private readonly config: ConfigService,
    @InjectQueue(QUEUE_SYNC_WEB) private readonly webQueue: Queue,
  ) {
    super();
    this.redis = new Redis(this.config.getOrThrow<string>('REDIS_URL'));
  }

  async process(job: Job<WebJobPayload>): Promise<void> {
    const { brandId, connectionId, kind, dimension, dateFrom, dateTo, window } =
      job.data;

    if (kind === 'fanout') {
      await this.runFanout(window ?? 'yesterday');
      return;
    }

    if (!brandId || !connectionId || !dateFrom || !dateTo) {
      throw new UnrecoverableError(
        `sync-web payload missing required fields for kind=${kind}`,
      );
    }

    const lockKey = `lock:sync:${connectionId}:${kind}:${dimension ?? 'kpi'}`;

    this.logger.log(
      `sync-web job ${job.id} kind=${kind} dim=${dimension ?? '-'} conn=${connectionId}`,
    );

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
      if (connection.channel !== ChannelEnum.ga4) {
        throw new UnrecoverableError(
          `connection ${connectionId} is not GA4 (channel=${connection.channel})`,
        );
      }

      const decrypted = this.decryptTokens(connection);
      const from = new Date(dateFrom);
      const to = new Date(dateTo);

      if (kind === 'kpi') {
        await this.runKpi(decrypted, from, to);
      } else {
        if (!dimension) {
          throw new UnrecoverableError(
            `breakdown job missing dimension (conn=${connectionId})`,
          );
        }
        await this.runBreakdown(decrypted, from, to, dimension);
      }

      await this.connectionsRepo.updateStatus(
        connectionId,
        ConnectionStatusEnum.connected,
        new Date(),
      );
      this.logger.log(`sync-web OK conn=${connectionId} kind=${kind}`);
    } catch (err) {
      // mark connection.status only for terminal errors; transient errors
      // throw to let BullMQ retry, status stays as-is.
      if (err instanceof UnrecoverableError) {
        await this.connectionsRepo.updateStatus(
          connectionId,
          ConnectionStatusEnum.error,
        );
      }
      this.logger.error(
        `sync-web FAIL conn=${connectionId} kind=${kind}`,
        err as Error,
      );
      throw err;
    } finally {
      await this.redis.del(lockKey);
    }
  }

  private async runFanout(window: FanoutWindow): Promise<void> {
    const connections = await this.connectionsRepo.findConnectedByChannel(
      ChannelEnum.ga4,
    );
    if (!connections.length) {
      this.logger.log('fanout: no GA4 connections to sync');
      return;
    }

    const { from, to } = this.buildFanoutRange(window);
    const fromIso = from.toISOString();
    const toIso = to.toISOString();
    const stamp = this.windowStamp(window);

    this.logger.log(
      `fanout window=${window} from=${fromIso} to=${toIso} brands=${connections.length}`,
    );

    for (const conn of connections) {
      const baseId = `web-${conn.id}-${stamp}`;
      await this.webQueue.add(
        'web-kpi',
        {
          brandId: conn.brandId,
          connectionId: conn.id,
          kind: 'kpi',
          dateFrom: fromIso,
          dateTo: toIso,
        },
        { jobId: `${baseId}-kpi` },
      );
      for (const dim of WEB_DIMENSIONS_TO_FAN) {
        await this.webQueue.add(
          'web-breakdown',
          {
            brandId: conn.brandId,
            connectionId: conn.id,
            kind: 'breakdown',
            dimension: dim,
            dateFrom: fromIso,
            dateTo: toIso,
          },
          { jobId: `${baseId}-${dim}` },
        );
      }
    }
  }

  private buildFanoutRange(window: FanoutWindow): { from: Date; to: Date } {
    const now = new Date();
    if (window === 'today') {
      const start = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
      return { from: start, to: now };
    }
    // yesterday: full UTC day D-1
    const startToday = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    );
    const from = new Date(startToday - 24 * 60 * 60 * 1000);
    const to = new Date(startToday - 1);
    return { from, to };
  }

  private windowStamp(window: FanoutWindow): string {
    const d = new Date();
    const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(
      d.getUTCDate(),
    ).padStart(2, '0')}`;
    return `${window}-${ymd}`;
  }

  private async runKpi(connection: Connection, from: Date, to: Date) {
    const rows = await this.ga4Provider.fetchMetrics(connection, { from, to });
    const snapshots: MetricSnapshot[] = rows.map((r) => {
      const s = new MetricSnapshot();
      s.connectionId = r.connectionId;
      s.brandId = r.brandId;
      s.date = r.date;
      s.metric = r.metric as MetricEnum;
      s.value = r.value;
      return s;
    });
    await this.metricsRepo.upsertMany(snapshots);
  }

  private async runBreakdown(
    connection: Connection,
    from: Date,
    to: Date,
    dimension: WebDimensionEnum,
  ) {
    const rows = await this.ga4Provider.fetchBreakdown(
      connection,
      { from, to },
      dimension,
    );
    const snapshots: WebDimensionSnapshot[] = rows.map((r) => {
      const s = new WebDimensionSnapshot();
      s.brandId = r.brandId;
      s.connectionId = r.connectionId;
      s.date = r.date;
      s.dimension = r.dimension;
      s.dimensionValue = r.dimensionValue;
      s.sessions = r.sessions;
      s.users = r.users;
      s.conversions = r.conversions;
      return s;
    });
    await this.webDimRepo.upsertMany(snapshots);
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
