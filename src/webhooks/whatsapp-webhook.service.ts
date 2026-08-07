import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';
import { QUEUE_WHATSAPP_SYNC } from '../queues/queue-names.constants';
import { WhatsappIngestService } from './whatsapp-ingest.service';

// Fields we subscribe to for WhatsApp Coexistence (see
// manual-integracion/whatsapp/coexistence/00-fase-0-setup-meta.md).
export type WhatsappWebhookField =
  | 'messages'
  | 'account_update'
  | 'history'
  | 'smb_app_state_sync'
  | 'smb_message_echoes';

export interface WhatsappWebhookChange {
  field?: string;
  value?: unknown;
}

export interface WhatsappWebhookEntry {
  id?: string;
  time?: number;
  changes?: WhatsappWebhookChange[];
}

export interface WhatsappWebhookPayload {
  object?: string;
  entry?: WhatsappWebhookEntry[];
}

@Injectable()
export class WhatsappWebhookService {
  private readonly logger = new Logger(WhatsappWebhookService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly ingest: WhatsappIngestService,
    @InjectQueue(QUEUE_WHATSAPP_SYNC) private readonly syncQueue: Queue,
  ) {}

  /**
   * GET handshake. Meta calls this when you save the callback URL in the App
   * Dashboard. Echo hub.challenge back only if hub.verify_token matches.
   */
  verify(mode?: string, token?: string, challenge?: string): string {
    const expected = this.config.get<string>(
      'META_WHATSAPP_WEBHOOK_VERIFY_TOKEN',
    );
    if (mode === 'subscribe' && expected && token === expected && challenge) {
      this.logger.log('WhatsApp webhook verified');
      return challenge;
    }
    this.logger.warn(
      `WhatsApp webhook verify failed (mode=${mode ?? '-'}, tokenMatch=${
        !!expected && token === expected
      })`,
    );
    throw new ForbiddenException('Verification failed');
  }

  /**
   * POST handler. Verifies the signature over the raw body, then routes each
   * change by field. Always resolves (the controller acks 200) — Meta must not
   * be retry-stormed on transient handling errors.
   */
  async handle(rawBody?: Buffer, signature?: string): Promise<void> {
    if (!this.verifySignature(rawBody, signature)) {
      this.logger.warn('WhatsApp webhook: invalid signature, ignoring');
      return;
    }

    let payload: WhatsappWebhookPayload;
    try {
      payload = JSON.parse(rawBody!.toString('utf8'));
    } catch {
      this.logger.warn('WhatsApp webhook: body is not valid JSON');
      return;
    }

    await this.route(payload);
  }

  private verifySignature(rawBody?: Buffer, signature?: string): boolean {
    // The X-Hub-Signature-256 is HMAC'd with the secret of the app that owns the
    // WhatsApp product (here the "Wappy" app = FACEBOOK_APP_SECRET), NOT the
    // separate Meta OAuth app (META_APP_SECRET). WHATSAPP_APP_SECRET overrides.
    const appSecret =
      this.config.get<string>('WHATSAPP_APP_SECRET') ??
      this.config.get<string>('FACEBOOK_APP_SECRET') ??
      this.config.get<string>('META_APP_SECRET');
    if (!appSecret) {
      this.logger.error(
        'No app secret configured (WHATSAPP_APP_SECRET/FACEBOOK_APP_SECRET) — cannot verify WhatsApp webhook',
      );
      return false;
    }
    if (!rawBody || !signature) return false;

    const expected =
      'sha256=' +
      crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');

    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    // timingSafeEqual throws on length mismatch, so guard first.
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  private async route(payload: WhatsappWebhookPayload): Promise<void> {
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const field = change.field ?? 'unknown';
        this.logger.log(
          `WhatsApp webhook: field=${field} waba=${entry.id ?? '-'}`,
        );
        try {
          if (field === 'history') {
            // History can carry thousands of messages → offload to the worker.
            await this.syncQueue.add('history', change.value);
          } else {
            await this.ingest.handleChange(field, change.value);
          }
        } catch (err) {
          // Never let one change abort the batch or trigger a Meta retry-storm.
          this.logger.error(
            `WhatsApp ingest failed for field=${field}`,
            err as Error,
          );
        }
      }
    }
  }
}
