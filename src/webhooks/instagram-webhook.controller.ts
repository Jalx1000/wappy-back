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
import { InstagramWebhookService } from './instagram-webhook.service';

// Public endpoint (no auth): Meta posts Instagram Direct event notifications here
// and performs a GET verification handshake when the callback URL is saved in the
// App Dashboard. Configure as:
//   https://<api-domain>/api/v1/webhooks/instagram
@ApiExcludeController()
@Controller({ path: 'webhooks/instagram', version: '1' })
export class InstagramWebhookController {
  constructor(private readonly service: InstagramWebhookService) {}

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
    await this.service.handle(req.rawBody, signature);
    return { status: 'ok' };
  }
}
