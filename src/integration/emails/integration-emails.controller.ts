import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../../api-keys/guards/api-key.guard';
import { IntegrationEmailsService } from './integration-emails.service';
import { SendEmailDto } from './dto/send-email.dto';

/**
 * Public integration API — transactional email (brief §2B). API-key auth.
 * Path: `POST /api/v1/integration/emails`.
 */
@ApiTags('Integration')
@UseGuards(ApiKeyGuard)
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
