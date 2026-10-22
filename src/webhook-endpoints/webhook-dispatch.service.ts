import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';
import axios from 'axios';
import { WebhookEndpointRepository } from './infrastructure/persistence/webhook-endpoint.repository';

/** Events Wappy emits to integrators (brief §3). */
export type WebhookEventType =
  | 'email.delivered'
  | 'email.bounced'
  | 'contact.unsubscribed'
  | 'whatsapp.delivered'
  | 'whatsapp.read'
  | 'message.inbound';

@Injectable()
export class WebhookDispatchService {
  private readonly logger = new Logger(WebhookDispatchService.name);

  constructor(private readonly endpoints: WebhookEndpointRepository) {}

  /** Signs a body with the endpoint secret: hex HMAC-SHA256 over the raw JSON. */
  static sign(secret: string, payload: string): string {
    return createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Fire-and-forget delivery of an event to every active endpoint of the brand.
   * Each POST carries `X-Wappy-Signature`. Failures are logged, never thrown —
   * a webhook problem must not break the business action that triggered it.
   */
  async dispatch(
    brandId: number,
    event: WebhookEventType,
    data: Record<string, unknown>,
  ): Promise<void> {
    let targets;
    try {
      targets = await this.endpoints.findActiveByBrand(brandId);
    } catch (e) {
      this.logger.warn(
        `webhook lookup failed for brand ${brandId}: ${String(e)}`,
      );
      return;
    }
    if (targets.length === 0) return;

    const body = JSON.stringify({
      event,
      ts: new Date().toISOString(),
      data,
    });

    await Promise.all(
      targets.map(async (endpoint) => {
        try {
          await axios.post(endpoint.url, body, {
            headers: {
              'Content-Type': 'application/json',
              'X-Wappy-Signature': WebhookDispatchService.sign(
                endpoint.secret,
                body,
              ),
            },
            timeout: 5000,
          });
        } catch (e) {
          this.logger.warn(
            `webhook delivery to ${endpoint.url} failed: ${String(e)}`,
          );
        }
      }),
    );
  }
}
