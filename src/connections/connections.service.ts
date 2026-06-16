import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectDataSource } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { DataSource } from 'typeorm';
import { Connection } from './domain/connection';
import { ConnectionsRepository } from './infrastructure/persistence/relational/repositories/connections.repository';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import { EncryptionService } from '../encryption/encryption.service';
import { NullableType } from '../utils/types/nullable.type';
import { ChannelEnum } from './domain/channel.enum';
import { ConnectionStatusEnum } from './domain/connection-status.enum';
import {
  QUEUE_SYNC_ADS,
  QUEUE_SYNC_SOCIAL,
  QUEUE_SYNC_WEB,
} from '../queues/queue-names.constants';
import { OAuthAccountResult } from '../oauth/oauth-provider.interface';
import { WebDimensionEnum } from '../analytics/domain/web-dimension.enum';

const ADS_CHANNELS = new Set<ChannelEnum>([
  ChannelEnum.google_ads,
  ChannelEnum.meta_ads,
  ChannelEnum.tiktok_ads,
  ChannelEnum.linkedin_ads,
]);

const SOCIAL_CHANNELS = new Set<ChannelEnum>([
  ChannelEnum.facebook_page,
  ChannelEnum.instagram,
  ChannelEnum.instagram_login,
  ChannelEnum.tiktok,
  ChannelEnum.linkedin,
  ChannelEnum.youtube,
]);

const BACKFILL_DAYS = 90;
const WEB_DIMENSIONS: WebDimensionEnum[] = [
  WebDimensionEnum.source,
  WebDimensionEnum.device,
  WebDimensionEnum.page,
  WebDimensionEnum.country,
  WebDimensionEnum.city,
];

@Injectable()
export class ConnectionsService {
  constructor(
    private readonly connectionsRepo: ConnectionsRepository,
    private readonly encryptionService: EncryptionService,
    @InjectQueue(QUEUE_SYNC_SOCIAL) private readonly syncSocialQueue: Queue,
    @InjectQueue(QUEUE_SYNC_ADS) private readonly syncAdsQueue: Queue,
    @InjectQueue(QUEUE_SYNC_WEB) private readonly syncWebQueue: Queue,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async create(brandId: number, dto: CreateConnectionDto): Promise<Connection> {
    const connection = new Connection();
    connection.brandId = brandId;
    connection.channel = dto.channel;
    connection.accountHandle = dto.accountHandle;
    connection.accountId = dto.accountId;
    connection.accessToken = this.encryptionService.encrypt(dto.accessToken);
    connection.refreshToken = dto.refreshToken
      ? this.encryptionService.encrypt(dto.refreshToken)
      : null;
    connection.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    connection.status = ConnectionStatusEnum.connected;
    connection.lastSyncAt = null;
    connection.scopes = dto.scopes ?? [];
    connection.metadata = dto.metadata ?? {};

    return this.connectionsRepo.create(connection);
  }

  async findAllForBrand(brandId: number): Promise<Connection[]> {
    return this.connectionsRepo.findByBrandId(brandId);
  }

  async findOne(brandId: number, id: number): Promise<Connection> {
    const connection = await this.connectionsRepo.findByBrandIdAndId(
      brandId,
      id,
    );
    if (!connection) throw new NotFoundException(`Connection #${id} not found`);
    return connection;
  }

  async findById(id: number): Promise<NullableType<Connection>> {
    return this.connectionsRepo.findById(id);
  }

  async update(
    brandId: number,
    id: number,
    dto: UpdateConnectionDto,
  ): Promise<Connection> {
    await this.findOne(brandId, id);
    const patch: Partial<Connection> = { ...dto } as Partial<Connection>;
    if (dto.accessToken) {
      patch.accessToken = this.encryptionService.encrypt(dto.accessToken);
    }
    if (dto.refreshToken) {
      patch.refreshToken = this.encryptionService.encrypt(dto.refreshToken);
    }
    return this.connectionsRepo.update(id, patch);
  }

  async remove(brandId: number, id: number): Promise<void> {
    await this.findOne(brandId, id);
    await this.connectionsRepo.softDelete(id);
  }

  async upsertFromOAuth(
    brandId: number,
    data: OAuthAccountResult,
  ): Promise<Connection> {
    const encryptedAccess = this.encryptionService.encrypt(data.accessToken);
    const encryptedRefresh = data.refreshToken
      ? this.encryptionService.encrypt(data.refreshToken)
      : null;

    const existing = await this.connectionsRepo.findByBrandChannelAccount(
      brandId,
      data.channel,
      data.accountId,
    );

    let connection: Connection;
    let isNew = false;
    if (existing) {
      connection = await this.connectionsRepo.update(existing.id, {
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh ?? existing.refreshToken,
        expiresAt: data.expiresAt ?? existing.expiresAt,
        accountHandle: data.accountHandle,
        status: ConnectionStatusEnum.connected,
        scopes: data.scopes,
        metadata: data.metadata,
      });
    } else {
      const fresh = new Connection();
      fresh.brandId = brandId;
      fresh.channel = data.channel;
      fresh.accountId = data.accountId;
      fresh.accountHandle = data.accountHandle;
      fresh.accessToken = encryptedAccess;
      fresh.refreshToken = encryptedRefresh;
      fresh.expiresAt = data.expiresAt ?? null;
      fresh.status = ConnectionStatusEnum.connected;
      fresh.lastSyncAt = null;
      fresh.scopes = data.scopes;
      fresh.metadata = data.metadata;
      connection = await this.connectionsRepo.create(fresh);
      isNew = true;
    }

    if (isNew && connection.channel === ChannelEnum.ga4) {
      await this.enqueueWebBackfill(brandId, connection.id);
    } else if (isNew && SOCIAL_CHANNELS.has(connection.channel)) {
      await this.enqueueSocialBackfill(brandId, connection.id);
    }

    return connection;
  }

  private async enqueueSocialBackfill(brandId: number, connectionId: number) {
    const to = new Date();
    const from = new Date(Date.now() - BACKFILL_DAYS * 24 * 60 * 60 * 1000);
    await this.syncSocialQueue.add(
      'sync-connection',
      { brandId, connectionId, dateFrom: from, dateTo: to },
      { jobId: `social-backfill-${connectionId}-${Date.now()}` },
    );
  }

  async findExpiring(before: Date): Promise<Connection[]> {
    return this.connectionsRepo.findExpiring(before);
  }

  async enqueueSync(
    brandId: number,
    id: number,
  ): Promise<{ jobIds: (string | undefined)[] }> {
    const connection = await this.findOne(brandId, id);
    const to = new Date();
    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    if (connection.channel === ChannelEnum.ga4) {
      return this.enqueueWebRange(brandId, id, from, to);
    }

    if (ADS_CHANNELS.has(connection.channel)) {
      const job = await this.syncAdsQueue.add(
        'ads-sync',
        {
          brandId,
          connectionId: id,
          kind: 'sync',
          dateFrom: from.toISOString(),
          dateTo: to.toISOString(),
        },
        { jobId: `ads-${id}-${Date.now()}` },
      );
      return { jobIds: [job.id] };
    }

    const job = await this.syncSocialQueue.add(
      'sync-connection',
      { brandId, connectionId: id, dateFrom: from, dateTo: to },
      { jobId: `social-${id}-${Date.now()}` },
    );
    return { jobIds: [job.id] };
  }

  async getJobState(
    queueName: 'web' | 'ads' | 'social',
    jobId: string,
  ): Promise<{
    state: string;
    progress: number | object | string | null;
    failedReason?: string;
  } | null> {
    const queue =
      queueName === 'web'
        ? this.syncWebQueue
        : queueName === 'ads'
          ? this.syncAdsQueue
          : this.syncSocialQueue;
    const job = await queue.getJob(jobId);
    if (!job) return null;
    const state = await job.getState();
    return {
      state,
      progress: (job.progress as number | object | string) ?? null,
      failedReason: job.failedReason,
    };
  }

  private async enqueueWebBackfill(brandId: number, connectionId: number) {
    const to = new Date();
    const from = new Date(Date.now() - BACKFILL_DAYS * 24 * 60 * 60 * 1000);
    await this.enqueueWebRange(brandId, connectionId, from, to);
  }

  async enqueueWebRange(
    brandId: number,
    connectionId: number,
    from: Date,
    to: Date,
  ): Promise<{ jobIds: (string | undefined)[] }> {
    const stamp = Date.now();
    const fromIso = from.toISOString();
    const toIso = to.toISOString();
    const jobs = await Promise.all([
      this.syncWebQueue.add(
        'web-kpi',
        {
          brandId,
          connectionId,
          kind: 'kpi',
          dateFrom: fromIso,
          dateTo: toIso,
        },
        { jobId: `web-${connectionId}-kpi-${stamp}` },
      ),
      ...WEB_DIMENSIONS.map((dimension) =>
        this.syncWebQueue.add(
          'web-breakdown',
          {
            brandId,
            connectionId,
            kind: 'breakdown',
            dimension,
            dateFrom: fromIso,
            dateTo: toIso,
          },
          { jobId: `web-${connectionId}-${dimension}-${stamp}` },
        ),
      ),
    ]);
    return { jobIds: jobs.map((j) => j.id) };
  }

  async findActiveByChannel(channel: ChannelEnum): Promise<Connection[]> {
    return this.connectionsRepo.findConnectedByChannel(channel);
  }

  /**
   * Move a connection (and ALL its historical data) to a different brand.
   * Updates connection.brand_id + cascades to metric_snapshot,
   * web_dimension_snapshot, ad_campaign and ad_metric_snapshot in a single
   * transaction. Returns the updated connection.
   */
  async reassignBrand(
    currentBrandId: number,
    id: number,
    newBrandId: number,
  ): Promise<Connection> {
    const connection = await this.findOne(currentBrandId, id);
    if (connection.brandId === newBrandId) return connection;

    await this.dataSource.transaction(async (em) => {
      await em.query('UPDATE connection SET "brandId" = $1 WHERE id = $2', [
        newBrandId,
        id,
      ]);
      await em.query(
        'UPDATE metric_snapshot SET "brandId" = $1 WHERE "connectionId" = $2',
        [newBrandId, id],
      );
      await em.query(
        'UPDATE post SET "brandId" = $1 WHERE "connectionId" = $2',
        [newBrandId, id],
      );
      await em.query(
        'UPDATE web_dimension_snapshot SET brand_id = $1 WHERE connection_id = $2',
        [newBrandId, id],
      );

      // Ads: ad_campaign holds connection_id, ad_metric_snapshot holds
      // campaign_id (so propagating via campaigns).
      const campaigns: { id: number }[] = await em.query(
        'SELECT id FROM ad_campaign WHERE connection_id = $1',
        [id],
      );
      if (campaigns.length > 0) {
        await em.query(
          'UPDATE ad_campaign SET brand_id = $1 WHERE connection_id = $2',
          [newBrandId, id],
        );
        const campaignIds = campaigns.map((c) => c.id);
        await em.query(
          'UPDATE ad_metric_snapshot SET brand_id = $1 WHERE campaign_id = ANY($2::int[])',
          [newBrandId, campaignIds],
        );
      }
    });

    const updated = await this.connectionsRepo.findById(id);
    if (!updated) throw new NotFoundException(`Connection #${id} not found`);
    return updated;
  }
}
