import {
  Body,
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../../api-keys/guards/api-key.guard';
import { IdempotencyInterceptor } from '../idempotency/idempotency.interceptor';
import { IntegrationEmailsService } from './integration-emails.service';
import { SendEmailDto } from './dto/send-email.dto';

/**
 * Public integration API — transactional email (brief §2B). API-key auth,
 * rate-limited, idempotent via `Idempotency-Key`. Path:
 * `POST /api/v1/integration/emails`.
 */
@ApiTags('Integration')
@UseGuards(ApiKeyGuard, ThrottlerGuard)
@UseInterceptors(IdempotencyInterceptor)
@Controller({ path: 'integration/emails', version: '1' })
export class IntegrationEmailsController {
  constructor(private readonly emails: IntegrationEmailsService) {}

  @Post()
  send(@Body() dto: SendEmailDto) {
    return this.emails.send({
      to: dto.to,
      template: dto.template,
      variables: dto.variables,
      subject: dto.subject,
      html: dto.html,
      replyTo: dto.reply_to,
    });
  }
}
