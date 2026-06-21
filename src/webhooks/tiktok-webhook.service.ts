import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConnectionsRepository } from '../connections/infrastructure/persistence/relational/repositories/connections.repository';
import { ChannelEnum } from '../connections/domain/channel.enum';
import { ConnectionStatusEnum } from '../connections/domain/connection-status.enum';

export interface TiktokWebhookPayload {
  client_key?: string;
  event?: string;
  create_time?: number;
  user_openid?: string;
  content?: string;
}

@Injectable()
export class TiktokWebhookService {
  private readonly logger = new Logger(TiktokWebhookService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly connectionsRepo: ConnectionsRepository,
  ) {}

  async handle(payload: TiktokWebhookPayload): Promise<void> {
    const expectedKey = this.config.get<string>('TIKTOK_CLIENT_KEY');
    if (
      expectedKey &&
      payload.client_key &&
      payload.client_key !== expectedKey
    ) {
      this.logger.warn('TikTok webhook: client_key mismatch, ignoring');
      return;
    }

    const event = payload.event ?? 'unknown';
    this.logger.log(
      `TikTok webhook: ${event} openid=${payload.user_openid ?? '-'}`,
    );

    // Authorization revoked by the user → flip matching connections to expired
    // so the UI prompts a reconnect instead of failing silently on sync.
    if (event === 'authorization.removed' || event === 'user.deauthorize') {
      await this.handleRevoke(payload.user_openid);
    }
    // Other events (video.publish.complete / .failed, etc.) are logged for now.
  }

  private async handleRevoke(openId?: string): Promise<void> {
    if (!openId) return;
    const conns = await this.connectionsRepo.findByChannelAndAccount(
      ChannelEnum.tiktok,
      openId,
    );
    for (const c of conns) {
      await this.connectionsRepo.updateStatus(
        c.id,
        ConnectionStatusEnum.expired,
      );
      this.logger.log(
        `TikTok connection ${c.id} marked expired (authorization removed)`,
      );
    }
  }
}
