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
import { OrdersService } from '../../orders/orders.service';
import { ApiKeyGuard } from '../../api-keys/guards/api-key.guard';
import { IdempotencyInterceptor } from '../idempotency/idempotency.interceptor';
import { Brand } from '../../brands/domain/brand';
import { CreateIntegrationOrderDto } from './dto/create-integration-order.dto';

/**
 * Public integration API — orders (brief §2A / S2). Auth by API key (Bearer);
 * the key resolves the brand. Rate-limited and idempotent via the
 * `Idempotency-Key` header; `external_id` is the business idempotency key so a
 * retried checkout never creates a duplicate order. Path:
 * `POST /api/v1/integration/orders`.
 */
@ApiTags('Integration')
@UseGuards(ApiKeyGuard, ThrottlerGuard)
@UseInterceptors(IdempotencyInterceptor)
@Controller({ path: 'integration/orders', version: '1' })
export class IntegrationOrdersController {
  constructor(
    private readonly contacts: ContactsService,
    private readonly orders: OrdersService,
  ) {}

  @Post()
  async create(
    @Req() req: { brand: Brand },
    @Body() dto: CreateIntegrationOrderDto,
  ): Promise<{ id: string; contact_id: string; created: boolean }> {
    const { email, phone, name } = dto.contact ?? {};
    if (!email && !phone) {
      throw new BadRequestException({
        error: {
          code: 'missing_identifier',
          message: 'contact.email or contact.phone is required',
        },
      });
    }

    const { contact, created } = await this.contacts.upsertByEmailOrPhone(
      req.brand.id,
      { email, phone, name, tags: ['pedido'] },
    );

    const items =
      dto.items?.map((i) => ({
        productName: i.product_name,
        sku: i.sku ?? null,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        lineTotal: i.line_total,
      })) ?? null;

    const order = await this.orders.createFromExternal(
      req.brand.id,
      contact.id,
      {
        externalId: dto.external_id,
        orderNumber: dto.order_number ?? null,
        currency: dto.currency ?? undefined,
        total: dto.total ?? undefined,
        items,
      },
    );

    return { id: order.id, contact_id: contact.id, created };
  }
}
