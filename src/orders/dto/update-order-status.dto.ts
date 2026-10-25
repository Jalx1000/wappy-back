import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ORDER_STATUSES, OrderStatus } from '../domain/order-status';

/** One editable line (product of interest filled in manually, or a purchase). */
export class OrderItemInputDto {
  @ApiPropertyOptional()
  @IsString()
  productName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string | null;

  @ApiPropertyOptional()
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional()
  @IsNumber()
  unitPrice: number;

  @ApiPropertyOptional()
  @IsNumber()
  lineTotal: number;
}

/** Patch an order from the kanban: move stage, edit total, notes or line items. */
export class UpdateOrderStatusDto {
  @ApiPropertyOptional({ enum: ORDER_STATUSES })
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: OrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  total?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional({ type: () => [OrderItemInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items?: OrderItemInputDto[] | null;
}
