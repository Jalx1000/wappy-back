import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { InboxMessagesRepository } from './infrastructure/persistence/relational/repositories/inbox-messages.repository';
import { InboxMessage } from './domain/inbox-message';

@Injectable()
export class InboxService {
  private readonly logger = new Logger(InboxService.name);

  constructor(
    private readonly messagesRepo: InboxMessagesRepository,
    private readonly configService: ConfigService,
  ) {}

  async getByBrand(
    brandId: number,
    status?: string,
    channel?: string,
    type?: string,
    limit?: number,
  ): Promise<InboxMessage[]> {
    return this.messagesRepo.findByBrand(brandId, status, channel, type, limit);
  }

  async updateMessageStatus(id: number, status: string): Promise<void> {
    await this.messagesRepo.updateStatus(id, status);
  }

  async handleMetaWebhook(payload: any, signature: string): Promise<void> {
    if (!this.verifyMetaSignature(payload, signature)) {
      this.logger.warn('Invalid Meta webhook signature');
      return;
    }

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === 'messages') {
          await this.processMetaMessage(change.value);
        }
      }
    }
  }

  private verifyMetaSignature(payload: any, signature: string): boolean {
    const secret = this.configService.get<string>('META_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.warn('META_WEBHOOK_SECRET not configured');
      return false;
    }

    const body = JSON.stringify(payload);
    const hash = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    return hash === signature;
  }

  private async processMetaMessage(value: any): Promise<void> {
    try {
      const { from, id: externalId, timestamp, text, image, video } = value;

      const existing = await this.messagesRepo.findByExternalId(externalId);
      if (existing) {
        this.logger.debug(`Message ${externalId} already exists`);
        return;
      }

      const message = new InboxMessage();
      message.channel = 'meta';
      message.externalId = externalId;
      message.type = 'comment';
      message.fromHandle = from;
      message.content = text || '';
      message.mediaUrl = image?.url || video?.url;
      message.publishedAt = new Date(parseInt(timestamp) * 1000);
      message.status = 'new';

      await this.messagesRepo.save(message as any);
      this.logger.log(`Processed Meta message ${externalId}`);
    } catch (err) {
      this.logger.error('Failed to process Meta webhook message', err);
    }
  }
}
