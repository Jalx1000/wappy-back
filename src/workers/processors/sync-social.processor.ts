import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue } from 'bullmq';
import Redis from 'ioredis';
import { ChannelEnum } from '../../connections/domain/channel.enum';
import { QUEUE_SYNC_SOCIAL } from '../../queues/queue-names.constants';
import { ConnectionsRepository } from '../../connections/infrastructure/persistence/relational/repositories/connections.repository';
import { MetricSnapshotsRepository } from '../../metrics/infrastructure/persistence/relational/repositories/metric-snapshots.repository';
import { PostsRepository } from '../../metrics/infrastructure/persistence/relational/repositories/posts.repository';
import { EncryptionService } from '../../encryption/encryption.service';
import { CHANNEL_PROVIDERS } from '../../channel-providers/channel-providers.module';
import { ChannelProvider } from '../../channel-providers/channel-provider.interface';
import { Connection } from '../../connections/domain/connection';
import { ConnectionStatusEnum } from '../../connections/domain/connection-status.enum';
import { MetricSnapshot } from '../../metrics/domain/metric-snapshot';
import { MetricEnum } from '../../metrics/domain/metric.enum';
import { Post } from '../../metrics/domain/post';

interface SyncJobPayload {
  kind?: 'sync' | 'fanout';
  window?: 'yesterday' | 'today';
  brandId?: number;
  connectionId?: number;
  dateFrom?: string;
  dateTo?: string;
}

const SOCIAL_CHANNELS: ChannelEnum[] = [
  ChannelEnum.facebook_page,
  ChannelEnum.instagram,
  ChannelEnum.instagram_login,
  ChannelEnum.tiktok,
  ChannelEnum.linkedin,
  ChannelEnum.youtube,
];

@Processor(QUEUE_SYNC_SOCIAL)
export class SyncSocialProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncSocialProcessor.name);
  private readonly redis: Redis;

  constructor(
    private readonly connectionsRepo: ConnectionsRepository,
    private readonly snapshotsRepo: MetricSnapshotsRepository,
    private readonly postsRepo: PostsRepository,
    private readonly encryptionService: EncryptionService,
    @Inject(CHANNEL_PROVIDERS) private readonly providers: ChannelProvider[],
    private readonly config: ConfigService,
    @InjectQueue(QUEUE_SYNC_SOCIAL) private readonly socialQueue: Queue,
  ) {
    super();
    this.redis = new Redis(this.config.getOrThrow<string>('REDIS_URL'));
  }

  async process(job: Job<SyncJobPayload>): Promise<void> {
    if (job.data.kind === 'fanout') {
      await this.runFanout(job.data.window ?? 'yesterday');
      return;
    }

    const { brandId, connectionId, dateFrom, dateTo } = job.data;
    if (!connectionId) {
      this.logger.warn(`sync-social job ${job.id} sin connectionId, skipping`);
      return;
    }
    const lockKey = `lock:sync:${connectionId}`;

    this.logger.log(`Processing sync-social job ${job.id} for connection ${connectionId}`);

    const lockAcquired = await this.redis.set(lockKey, '1', 'EX', 600, 'NX');
    if (!lockAcquired) {
      this.logger.debug(
        `Another worker is already syncing connection ${connectionId}, skipping`,
      );
      return;
    }

    try {
      const connection = await this.connectionsRepo.findById(connectionId);
      if (!connection) {
        this.logger.warn(`Connection ${connectionId} not found, skipping`);
        return;
      }

      const to = dateTo ? new Date(dateTo) : new Date();
      const from = dateFrom
        ? new Date(dateFrom)
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const decryptedConnection = this.decryptTokens(connection);

      const provider = this.providers.find((p) => p.channel === connection.channel);
      if (!provider) {
        this.logger.warn(
          `No provider for channel ${connection.channel}, skipping job ${job.id}`,
        );
        return;
      }

      // Fetch metrics and posts independently: a failure in one must not block
      // the other, so a metrics error never silently drops publications.
      const [metricsRes, postsRes] = await Promise.allSettled([
        provider.fetchMetrics(decryptedConnection, { from, to }),
        provider.fetchPosts(decryptedConnection, { from, to }),
      ]);
      if (metricsRes.status === 'rejected') {
        this.logger.error(
          `fetchMetrics failed for connection ${connectionId}`,
          metricsRes.reason,
        );
      }
      if (postsRes.status === 'rejected') {
        this.logger.error(
          `fetchPosts failed for connection ${connectionId}`,
          postsRes.reason,
        );
      }
      const metricRows =
        metricsRes.status === 'fulfilled' ? metricsRes.value : [];
      const postRows = postsRes.status === 'fulfilled' ? postsRes.value : [];

      const snapshots: MetricSnapshot[] = metricRows.map((row) => {
        const s = new MetricSnapshot();
        s.connectionId = row.connectionId;
        s.brandId = row.brandId;
        s.date = row.date;
        s.metric = row.metric as MetricEnum;
        s.value = row.value;
        return s;
      });

      const posts: Post[] = postRows.map((row) => {
        const p = new Post();
        p.brandId = row.brandId;
        p.connectionId = row.connectionId;
        p.externalId = row.externalId;
        p.publishedAt = row.publishedAt;
        p.type = row.type;
        p.caption = row.caption;
        p.mediaUrl = row.mediaUrl;
        p.metrics = row.metrics;
        return p;
      });

      // Persist snapshots and posts independently so a write failure in one
      // (e.g. a bad metric row) never wipes the other.
      let snapshotsErr: unknown;
      let postsErr: unknown;
      try {
        await this.snapshotsRepo.upsertMany(snapshots);
      } catch (e) {
        snapshotsErr = e;
        this.logger.error(
          `snapshot upsert failed for connection ${connectionId}`,
          e,
        );
      }
      try {
        await this.postsRepo.upsertMany(posts);
      } catch (e) {
        postsErr = e;
        this.logger.error(
          `post upsert failed for connection ${connectionId}`,
          e,
        );
      }

      // Mark error only when nothing at all could be fetched or stored;
      // otherwise the connection is (at least partially) healthy.
      const totalFailed =
        metricsRes.status === 'rejected' &&
        postsRes.status === 'rejected';
      const writeFailed = snapshotsErr && postsErr;
      if (totalFailed || writeFailed) {
        await this.connectionsRepo.updateStatus(
          connectionId,
          ConnectionStatusEnum.error,
        );
        const reason =
          snapshotsErr ??
          postsErr ??
          (metricsRes.status === 'rejected' ? metricsRes.reason : undefined) ??
          (postsRes.status === 'rejected' ? postsRes.reason : undefined) ??
          new Error(`Sync failed for connection ${connectionId}`);
        throw reason;
      }

      await this.connectionsRepo.updateStatus(
        connectionId,
        ConnectionStatusEnum.connected,
        new Date(),
      );

      this.logger.log(
        `Sync complete for connection ${connectionId}: ${snapshots.length} snapshots, ${posts.length} posts`,
      );
    } catch (err) {
      this.logger.error(`Sync failed for connection ${connectionId}`, err);
      await this.connectionsRepo.updateStatus(connectionId, ConnectionStatusEnum.error);
      throw err;
    } finally {
      await this.redis.del(lockKey);
    }
  }

  // Encola un sync individual por cada conexión social viva de marcas activas.
  // Sin dateFrom/dateTo: cada job usa su ventana default de 7 días, que cubre
  // el engagement tardío de posts recientes. Idempotente vía upserts + jobId.
  private async runFanout(window: 'yesterday' | 'today'): Promise<void> {
    const connections = (
      await Promise.all(
        SOCIAL_CHANNELS.map((ch) =>
          this.connectionsRepo.findConnectedByChannel(ch),
        ),
      )
    ).flat();

    if (!connections.length) {
      this.logger.log('social fanout: no active connections');
      return;
    }

    const d = new Date();
    const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(
      d.getUTCDate(),
    ).padStart(2, '0')}`;

    for (const conn of connections) {
      await this.socialQueue.add(
        'sync-connection',
        { brandId: conn.brandId, connectionId: conn.id },
        { jobId: `social-${conn.id}-${window}-${ymd}` },
      );
    }
    this.logger.log(
      `social fanout window=${window} encoladas=${connections.length}`,
    );
  }

  private decryptTokens(connection: Connection): Connection {
    const decrypted = Object.assign(new Connection(), connection);
    try {
      decrypted.accessToken = this.encryptionService.decrypt(
        connection.accessToken,
      );
    } catch {
      decrypted.accessToken = connection.accessToken;
    }
    if (connection.refreshToken) {
      try {
        decrypted.refreshToken = this.encryptionService.decrypt(
          connection.refreshToken,
        );
      } catch {
        decrypted.refreshToken = connection.refreshToken;
      }
    }
    return decrypted;
  }
}
