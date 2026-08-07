import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { MessengerIngestService } from './messenger-ingest.service';

// A single item inside entry[].messaging[] (Messenger Platform delivery for a
// Facebook Page). Same envelope as Instagram Direct — see
// planning/meta/01-webhooks-y-payloads.md.
export interface MsgrMessagingItem {
  sender?: { id?: string };
  recipient?: { id?: string };
  timestamp?: number;
  message?: {
    mid?: string;
    text?: string;
    is_echo?: boolean;
    attachments?: Array<{ type?: string; payload?: { url?: string } }>;
  };
  reaction?: { mid?: string; action?: string; emoji?: string };
  read?: { watermark?: number };
  delivery?: { mids?: string[]; watermark?: number };
  postback?: { mid?: string; title?: string; payload?: string };
}

export interface MsgrWebhookEntry {
  id?: string; // our Facebook Page id
  time?: number;
  messaging?: MsgrMessagingItem[];
}

export interface MsgrWebhookPayload {
  object?: string; // "page"
  entry?: MsgrWebhookEntry[];
}

@Injectable()
export class MessengerWebhookService {
  private readonly logger = new Logger(MessengerWebhookService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly ingest: MessengerIngestService,
  ) {}

  /**
   * GET handshake. Meta calls this when you save the callback URL in the App
   * Dashboard. Echo hub.challenge back only if hub.verify_token matches.
   */
  verify(mode?: string, token?: string, challenge?: string): string {
    const expected =
      this.config.get<string>('META_MESSENGER_WEBHOOK_VERIFY_TOKEN') ??
      this.config.get<string>('META_WEBHOOK_VERIFY_TOKEN');
    if (mode === 'subscribe' && expected && token === expected && challenge) {
      this.logger.log('Messenger webhook verified');
      return challenge;
    }
    this.logger.warn(
      `Messenger webhook verify failed (mode=${mode ?? '-'}, tokenMatch=${
        !!expected && token === expected
      })`,
    );
    throw new ForbiddenException('Verification failed');
  }

  /**
   * POST handler. Verifies the signature over the raw body, then routes each
   * messaging event. Always resolves (the controller acks 200) so Meta is not
   * retry-stormed on transient handling errors.
   */
  async handle(rawBody?: Buffer, signature?: string): Promise<void> {
    if (!this.verifySignature(rawBody, signature)) {
      this.logger.warn('Messenger webhook: invalid signature, ignoring');
      return;
    }

    let payload: MsgrWebhookPayload;
    try {
      payload = JSON.parse(rawBody!.toString('utf8'));
    } catch {
      this.logger.warn('Messenger webhook: body is not valid JSON');
      return;
    }

    if (payload.object !== 'page') {
      this.logger.debug(
        `Messenger webhook: ignoring object=${payload.object ?? '-'}`,
      );
      return;
    }

    await this.route(payload);
  }

  private verifySignature(rawBody?: Buffer, signature?: string): boolean {
    if (!rawBody || !signature) return false;

    // The Page is connected/subscribed through a Facebook app; accept the
    // payload if the signature matches ANY configured app secret (a dedicated
    // Messenger app secret, the Meta OAuth app, or the Facebook Login app).
    const candidates = [
      this.config.get<string>('MESSENGER_APP_SECRET'),
      this.config.get<string>('META_APP_SECRET'),
      this.config.get<string>('FACEBOOK_APP_SECRET'),
    ].filter((s): s is string => !!s);

    if (candidates.length === 0) {
      this.logger.error(
        'No app secret configured (MESSENGER_APP_SECRET/META_APP_SECRET/FACEBOOK_APP_SECRET) — cannot verify Messenger webhook',
      );
      return false;
    }

    const sig = Buffer.from(signature);
    return candidates.some((secret) => {
      const expected =
        'sha256=' +
        crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
      const exp = Buffer.from(expected);
      // timingSafeEqual throws on length mismatch, so guard first.
      return exp.length === sig.length && crypto.timingSafeEqual(exp, sig);
    });
  }

  private async route(payload: MsgrWebhookPayload): Promise<void> {
    for (const entry of payload.entry ?? []) {
      for (const item of entry.messaging ?? []) {
        try {
          await this.ingest.handleMessaging(entry.id, item);
        } catch (err) {
          // Never let one event abort the batch or trigger a Meta retry-storm.
          this.logger.error(
            `Messenger ingest failed for entry=${entry.id ?? '-'}`,
            err as Error,
          );
        }
      }
    }
  }
}
