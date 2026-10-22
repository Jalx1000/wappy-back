import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { ContactsService } from '../../contacts/contacts.service';
import { ApiKeyGuard } from '../../api-keys/guards/api-key.guard';
import { IdempotencyInterceptor } from '../idempotency/idempotency.interceptor';
import { Brand } from '../../brands/domain/brand';
import { UpsertContactDto } from './dto/upsert-contact.dto';

/**
 * Public integration API — contacts (brief §2A). Auth by API key (Bearer); the
 * key resolves the brand, so there is no x-brand-id here. Rate-limited, and
 * idempotent via the `Idempotency-Key` header. Path:
 * `POST /api/v1/integration/contacts`.
 */
@ApiTags('Integration')
@UseGuards(ApiKeyGuard, ThrottlerGuard)
@UseInterceptors(IdempotencyInterceptor)
@Controller({ path: 'integration/contacts', version: '1' })
export class IntegrationContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Post()
  async upsert(
    @Req() req: { brand: Brand },
    @Body() dto: UpsertContactDto,
  ): Promise<{ id: string; created: boolean }> {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException({
        error: {
          code: 'missing_identifier',
          message: 'email or phone is required',
        },
      });
    }
    // Fold list_id into tags so a single tags field carries list membership.
    const tags = [
      ...(dto.tags ?? []),
      ...(dto.list_id ? [dto.list_id] : []),
      ...(dto.source ? [dto.source] : []),
    ];
    const { contact, created } = await this.contacts.upsertByEmailOrPhone(
      req.brand.id,
      {
        email: dto.email,
        phone: dto.phone,
        name: dto.name,
        tags: tags.length > 0 ? Array.from(new Set(tags)) : null,
        consent: dto.consent ?? null,
        metadata: dto.metadata ?? null,
      },
    );
    return { id: contact.id, created };
  }
}
