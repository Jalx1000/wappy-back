import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import Redis from 'ioredis';
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
  brandId: number;
  connectionId: number;
  dateFrom?: string;
  dateTo?: string;
}

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
  ) {
    super();
    this.redis = new Redis(this.config.getOrThrow<string>('REDIS_URL'));
  }

  async process(job: Job<SyncJobPayload>): Promise<void> {
    const { brandId, connectionId, dateFrom, dateTo } = job.data;
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

      const [metricRows, postRows] = await Promise.all([
        provider.fetchMetrics(decryptedConnection, { from, to }),
        provider.fetchPosts(decryptedConnection, { from, to }),
      ]);

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

      await this.snapshotsRepo.upsertMany(snapshots);
      await this.postsRepo.upsertMany(posts);

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
