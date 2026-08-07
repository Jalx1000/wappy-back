import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Request } from 'express';
import { WhatsappWebhookService } from './whatsapp-webhook.service';

// Public endpoint (no auth): Meta posts WhatsApp event notifications here and
// performs a GET verification handshake when the callback URL is saved in the
// App Dashboard. Configure as:
//   https://<api-domain>/api/v1/webhooks/whatsapp
@ApiExcludeController()
@Controller({ path: 'webhooks/whatsapp', version: '1' })
export class WhatsappWebhookController {
  constructor(private readonly service: WhatsappWebhookService) {}

  // GET verification handshake. Query keys carry dots ("hub.mode"); Express's
  // qs parser stores them as literal keys, so @Query('hub.mode') resolves them.
  @Get()
  verify(
    @Query('hub.mode') mode?: string,
    @Query('hub.verify_token') token?: string,
    @Query('hub.challenge') challenge?: string,
  ): string {
    return this.service.verify(mode, token, challenge);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature?: string,
  ): Promise<{ status: string }> {
    // Acknowledge regardless: signature/handling failures are logged inside the
    // service so Meta never retry-storms on transient errors.
    await this.service.handle(req.rawBody, signature);
    return { status: 'ok' };
  }
}
