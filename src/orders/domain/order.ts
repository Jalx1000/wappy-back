import { ApiProperty } from '@nestjs/swagger';
import { OrderItem } from './order-item';

export class Order {
  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  notes?: string | null;

  @ApiProperty({
    type: () => String,
    description: 'lead | woocommerce | manual',
    nullable: false,
  })
  source?: string;

  @ApiProperty({
    type: () => String,
    description:
      'External system order id (e.g. WooCommerce) — idempotency key',
    nullable: true,
  })
  externalId?: string | null;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  orderNumber?: string | null;

  @ApiProperty({
    type: () => [OrderItem],
    nullable: true,
  })
  items?: OrderItem[] | null;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  currency?: string;

  @ApiProperty({
    type: () => Number,
    nullable: false,
  })
  total?: number;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  status: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  contactId: string;

  @ApiProperty({
    type: () => Number,
    nullable: false,
  })
  brandId: number;

  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
