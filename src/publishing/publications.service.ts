import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CalendarItemsRepository } from '../calendar/infrastructure/persistence/relational/repositories/calendar-items.repository';
import { ConnectionsRepository } from '../connections/infrastructure/persistence/relational/repositories/connections.repository';
import { ChannelEnum } from '../connections/domain/channel.enum';
import { ConnectionStatusEnum } from '../connections/domain/connection-status.enum';
import { Connection } from '../connections/domain/connection';
import { EncryptionService } from '../encryption/encryption.service';
import {
  TiktokPrivacyLevel,
  TiktokPublishService,
} from '../channel-providers/providers/tiktok/tiktok-publish.service';
import { MetaPublishService } from '../channel-providers/providers/meta/meta-publish.service';
import { MediaResolverService } from './media-resolver.service';

export interface PublicationResult {
  itemId: number;
  status: 'published' | 'failed';
  results: Record<string, NetworkResult>;
}

interface NetworkResult {
  ok: boolean;
  publishId?: string;
  mode?: string;
  error?: string;
  at: string;
}

// Shape stored in calendar_item.metadata for a publishable item. The Calendar
// modal (frontend) writes these; the orchestration below reads them.
interface PublicationMeta {
  assetId?: number;
  networks?: string[];
  tiktokConnectionId?: number;
  tiktokMode?: 'direct' | 'inbox';
  privacyLevel?: TiktokPrivacyLevel;
  disableComment?: boolean;
  disableDuet?: boolean;
  disableStitch?: boolean;
  facebookConnectionId?: number;
  instagramConnectionId?: number;
  results?: Record<string, NetworkResult>;
}

@Injectable()
export class PublicationsService {
  private readonly logger = new Logger(PublicationsService.name);

  constructor(
    private readonly calendarRepo: CalendarItemsRepository,
    private readonly connectionsRepo: ConnectionsRepository,
    private readonly encryption: EncryptionService,
    private readonly media: MediaResolverService,
    private readonly tiktokPublish: TiktokPublishService,
    private readonly metaPublish: MetaPublishService,
  ) {}

  // Publish a calendar item to every selected network. Each network is
  // independent: one failing does not abort the others, and per-network results
  // are persisted back to the item's metadata.
  async publishCalendarItem(
    itemId: number,
    brandId: number,
  ): Promise<PublicationResult> {
    const item = await this.calendarRepo.findById(itemId);
    if (!item || item.brandId !== brandId) {
      throw new NotFoundException('Calendar item not found');
    }
    const meta = (item.metadata ?? {}) as PublicationMeta;

    if (!meta.assetId) {
      throw new BadRequestException(
        'Calendar item has no assetId in metadata to publish',
      );
    }
    const networks = meta.networks ?? (item.connectionId ? ['tiktok'] : []);
    if (networks.length === 0) {
      throw new BadRequestException('Calendar item has no target networks');
    }

    const results: Record<string, NetworkResult> = { ...(meta.results ?? {}) };

    if (networks.includes('tiktok')) {
      results.tiktok = await this.publishTiktok(item, brandId, meta);
    }
    if (networks.includes('facebook')) {
      results.facebook = await this.publishMeta('facebook', item, brandId, meta);
    }
    if (networks.includes('instagram')) {
      results.instagram = await this.publishMeta(
        'instagram',
        item,
        brandId,
        meta,
      );
    }

    const anyFail = Object.values(results).some((r) => r.ok === false);
    const status = anyFail ? 'failed' : 'published';

    item.status = status;
    item.metadata = { ...meta, results };
    await this.calendarRepo.save(item);

    return { itemId, status, results };
  }

  private async publishTiktok(
    item: {
      id: number;
      title: string;
      description?: string;
      connectionId?: number;
    },
    brandId: number,
    meta: PublicationMeta,
  ): Promise<NetworkResult> {
    const at = new Date().toISOString();
    try {
      const connectionId = meta.tiktokConnectionId ?? item.connectionId;
      if (!connectionId) {
        throw new Error('No TikTok connection set for this item');
      }
      const conn = await this.connectionsRepo.findByBrandIdAndId(
        brandId,
        connectionId,
      );
      if (!conn) {
        throw new Error(`TikTok connection #${connectionId} not found`);
      }
      if (conn.channel !== ChannelEnum.tiktok) {
        throw new Error('Connection is not a TikTok organic account');
      }
      const token = this.decrypt(conn.accessToken);
      const video = await this.media.resolveAsset(meta.assetId!, brandId);

      const mode = meta.tiktokMode === 'direct' ? 'direct' : 'inbox';
      const postInfo =
        mode === 'direct'
          ? {
              title: item.title,
              privacyLevel: meta.privacyLevel ?? 'SELF_ONLY',
              disableComment: meta.disableComment,
              disableDuet: meta.disableDuet,
              disableStitch: meta.disableStitch,
            }
          : undefined;

      const r = await this.tiktokPublish.publishVideo(
        token,
        { buffer: video.buffer, mimeType: video.mimeType },
        { mode, postInfo },
      );
      this.logger.log(
        `Published calendar item ${item.id} to TikTok (${r.mode}): ${r.publishId}`,
      );
      return { ok: true, publishId: r.publishId, mode: r.mode, at };
    } catch (err) {
      const error = (err as Error).message;
      this.logger.error(
        `TikTok publish failed for calendar item ${item.id}: ${error}`,
      );
      return { ok: false, error, at };
    }
  }

  private async publishMeta(
    network: 'facebook' | 'instagram',
    item: { id: number; title: string; description?: string },
    brandId: number,
    meta: PublicationMeta,
  ): Promise<NetworkResult> {
    const at = new Date().toISOString();
    try {
      const channel =
        network === 'facebook'
          ? ChannelEnum.facebook_page
          : ChannelEnum.instagram;
      const overrideId =
        network === 'facebook'
          ? meta.facebookConnectionId
          : meta.instagramConnectionId;
      const conn = await this.resolveConnection(brandId, channel, overrideId);
      const token = this.decrypt(conn.accessToken);
      const media = await this.media.resolveAssetUrl(meta.assetId!, brandId);
      const caption = item.description ?? item.title;

      const r =
        network === 'facebook'
          ? await this.metaPublish.publishFacebookVideo(
              conn.accountId,
              token,
              media.url,
              caption,
            )
          : await this.metaPublish.publishInstagramReel(
              conn.accountId,
              token,
              media.url,
              caption,
            );
      this.logger.log(
        `Published calendar item ${item.id} to ${network}: ${r.postId}`,
      );
      return { ok: true, publishId: r.postId, mode: network, at };
    } catch (err) {
      const error = (err as Error).message;
      this.logger.error(
        `${network} publish failed for calendar item ${item.id}: ${error}`,
      );
      return { ok: false, error, at };
    }
  }

  private async resolveConnection(
    brandId: number,
    channel: ChannelEnum,
    overrideId?: number,
  ): Promise<Connection> {
    if (overrideId) {
      const c = await this.connectionsRepo.findByBrandIdAndId(
        brandId,
        overrideId,
      );
      if (c) return c;
    }
    const all = await this.connectionsRepo.findByBrandId(brandId);
    const c =
      all.find(
        (x) =>
          x.channel === channel &&
          x.status === ConnectionStatusEnum.connected,
      ) ?? all.find((x) => x.channel === channel);
    if (!c) {
      throw new Error(`No ${channel} connection for brand`);
    }
    return c;
  }

  private decrypt(token: string): string {
    try {
      return this.encryption.decrypt(token);
    } catch {
      return token;
    }
  }
}
