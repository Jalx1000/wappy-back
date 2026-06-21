import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CalendarService } from '../calendar/calendar.service';
import { ConnectionsService } from '../connections/connections.service';
import { ChannelEnum } from '../connections/domain/channel.enum';
import { EncryptionService } from '../encryption/encryption.service';
import {
  TiktokPrivacyLevel,
  TiktokPublishService,
} from '../channel-providers/providers/tiktok/tiktok-publish.service';
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
  results?: Record<string, NetworkResult>;
}

@Injectable()
export class PublicationsService {
  private readonly logger = new Logger(PublicationsService.name);

  constructor(
    private readonly calendar: CalendarService,
    private readonly connectionsService: ConnectionsService,
    private readonly encryption: EncryptionService,
    private readonly media: MediaResolverService,
    private readonly tiktokPublish: TiktokPublishService,
  ) {}

  // Publish a calendar item to every selected network. Each network is
  // independent: one failing does not abort the others, and per-network results
  // are persisted back to the item's metadata.
  async publishCalendarItem(
    itemId: number,
    brandId: number,
  ): Promise<PublicationResult> {
    const item = await this.calendar.getById(itemId, brandId);
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
    // facebook / instagram: added in a later step (Meta publishing).

    const anyFail = Object.values(results).some((r) => r.ok === false);
    const status = anyFail ? 'failed' : 'published';

    await this.calendar.update(itemId, brandId, {
      status,
      metadata: { ...meta, results },
    });

    return { itemId, status, results };
  }

  private async publishTiktok(
    item: { id: number; title: string; connectionId?: number },
    brandId: number,
    meta: PublicationMeta,
  ): Promise<NetworkResult> {
    const at = new Date().toISOString();
    try {
      const connectionId = meta.tiktokConnectionId ?? item.connectionId;
      if (!connectionId) {
        throw new Error('No TikTok connection set for this item');
      }
      const conn = await this.connectionsService.findOne(brandId, connectionId);
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

  private decrypt(token: string): string {
    try {
      return this.encryption.decrypt(token);
    } catch {
      return token;
    }
  }
}
