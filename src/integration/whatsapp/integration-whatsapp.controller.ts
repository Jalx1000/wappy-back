import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../../api-keys/guards/api-key.guard';
import { IdempotencyInterceptor } from '../idempotency/idempotency.interceptor';
import { Brand } from '../../brands/domain/brand';
import { IntegrationWhatsappService } from './integration-whatsapp.service';
import { SendWhatsappDto } from './dto/send-whatsapp.dto';

/**
 * Public integration API — WhatsApp (brief §2C). API-key auth, rate-limited,
 * idempotent. Path: `POST /api/v1/integration/whatsapp/messages`.
 */
@ApiTags('Integration')
@UseGuards(ApiKeyGuard, ThrottlerGuard)
@UseInterceptors(IdempotencyInterceptor)
@Controller({ path: 'integration/whatsapp/messages', version: '1' })
export class IntegrationWhatsappController {
  constructor(private readonly whatsapp: IntegrationWhatsappService) {}

  @Post()
  send(@Req() req: { brand: Brand }, @Body() dto: SendWhatsappDto) {
    return this.whatsapp.send(req.brand.id, {
      to: dto.to,
      template: dto.template,
      params: dto.params,
      language: dto.language,
      text: dto.text,
    });
  }
}
