import { ApiProperty } from '@nestjs/swagger';

/**
 * A single line of an order (one product bought, or a product of interest filled
 * in manually for a lead). Stored as a jsonb array on the order — no separate
 * table — since lines are only ever read as part of their order.
 */
export class OrderItem {
  @ApiProperty({ type: () => String })
  productName: string;

  @ApiProperty({ type: () => String, nullable: true })
  sku?: string | null;

  @ApiProperty({ type: () => Number })
  quantity: number;

  @ApiProperty({ type: () => Number })
  unitPrice: number;

  @ApiProperty({ type: () => Number })
  lineTotal: number;
}
