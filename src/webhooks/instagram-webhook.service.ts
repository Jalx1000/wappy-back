import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { InstagramIngestService } from './instagram-ingest.service';

// A single item inside entry[].messaging[] (Messenger-style delivery, used by
// Instagram Direct). See planning/meta/01-webhooks-y-payloads.md.
export interface IgMessagingItem {
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
  read?: { mid?: string };
}

export interface IgWebhookEntry {
  id?: string; // our IG account id
  time?: number;
  messaging?: IgMessagingItem[];
}

export interface IgWebhookPayload {
  object?: string; // "instagram"
  entry?: IgWebhookEntry[];
}

@Injectable()
export class InstagramWebhookService {
  private readonly logger = new Logger(InstagramWebhookService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly ingest: InstagramIngestService,
  ) {}

  /**
   * GET handshake. Meta calls this when you save the callback URL in the App
   * Dashboard. Echo hub.challenge back only if hub.verify_token matches.
   */
  verify(mode?: string, token?: string, challenge?: string): string {
    const expected =
      this.config.get<string>('INSTAGRAM_LOGIN_WEBHOOK_VERIFY_TOKEN') ??
      this.config.get<string>('META_INSTAGRAM_WEBHOOK_VERIFY_TOKEN');
    if (mode === 'subscribe' && expected && token === expected && challenge) {
      this.logger.log('Instagram webhook verified');
      return challenge;
    }
    this.logger.warn(
      `Instagram webhook verify failed (mode=${mode ?? '-'}, tokenMatch=${
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
      this.logger.warn('Instagram webhook: invalid signature, ignoring');
      return;
    }

    let payload: IgWebhookPayload;
    try {
      payload = JSON.parse(rawBody!.toString('utf8'));
    } catch {
      this.logger.warn('Instagram webhook: body is not valid JSON');
      return;
    }

    if (payload.object !== 'instagram') {
      this.logger.debug(
        `Instagram webhook: ignoring object=${payload.object ?? '-'}`,
      );
      return;
    }

    await this.route(payload);
  }

  private verifySignature(rawBody?: Buffer, signature?: string): boolean {
    if (!rawBody || !signature) return false;

    // Instagram Direct can arrive from two different Meta apps, each with its own
    // secret (they are distinct app ids):
    //  - Instagram API with Instagram Login → INSTAGRAM_LOGIN_APP_SECRET (primary)
    //  - IG business account linked to a Facebook Page → META_APP_SECRET
    // Accept the payload if the signature matches ANY configured secret.
    const candidates = [
      this.config.get<string>('INSTAGRAM_LOGIN_APP_SECRET'),
      this.config.get<string>('META_APP_SECRET'),
      this.config.get<string>('FACEBOOK_APP_SECRET'),
    ].filter((s): s is string => !!s);

    if (candidates.length === 0) {
      this.logger.error(
        'No app secret configured (INSTAGRAM_LOGIN_APP_SECRET/META_APP_SECRET/FACEBOOK_APP_SECRET) — cannot verify Instagram webhook',
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

  private async route(payload: IgWebhookPayload): Promise<void> {
    for (const entry of payload.entry ?? []) {
      for (const item of entry.messaging ?? []) {
        try {
          await this.ingest.handleMessaging(entry.id, item);
        } catch (err) {
          // Never let one event abort the batch or trigger a Meta retry-storm.
          this.logger.error(
            `Instagram ingest failed for entry=${entry.id ?? '-'}`,
            err as Error,
          );
        }
      }
    }
  }
}
