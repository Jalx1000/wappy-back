import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

/** One purchased line (snake_case public contract, as sent by the plugin). */
export class IntegrationOrderItemDto {
  @ApiProperty()
  @IsString()
  product_name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string | null;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsNumber()
  unit_price: number;

  @ApiProperty()
  @IsNumber()
  line_total: number;
}

/** Contact identity from the store checkout. At least one of email/phone. */
export class IntegrationOrderContactDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string | null;
}

/**
 * Public order payload (brief §2A / S2). The external store (WooCommerce) sends
 * the checkout contact plus the full order detail; `external_id` makes the
 * create idempotent.
 */
export class CreateIntegrationOrderDto {
  @ApiProperty({ type: () => IntegrationOrderContactDto })
  @IsObject()
  @ValidateNested()
  @Type(() => IntegrationOrderContactDto)
  contact: IntegrationOrderContactDto;

  @ApiProperty({ description: 'External order id (idempotency key)' })
  @IsString()
  external_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  order_number?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  total?: number | null;

  @ApiPropertyOptional({ type: () => [IntegrationOrderItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IntegrationOrderItemDto)
  items?: IntegrationOrderItemDto[] | null;
}
