import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import {
  TiktokWebhookPayload,
  TiktokWebhookService,
} from './tiktok-webhook.service';

// Public endpoint (no auth): TikTok posts event notifications here. Configure
// this URL as the webhook in the TikTok developer portal. Always returns 200
// so TikTok does not retry-storm on transient handling errors.
@ApiExcludeController()
@Controller({ path: 'webhooks/tiktok', version: '1' })
export class TiktokWebhookController {
  constructor(private readonly service: TiktokWebhookService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(
    @Body() payload: TiktokWebhookPayload,
  ): Promise<{ status: string }> {
    try {
      await this.service.handle(payload);
    } catch {
      // swallow: acknowledge receipt regardless
    }
    return { status: 'ok' };
  }
}
