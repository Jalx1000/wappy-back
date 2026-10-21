import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { ORDER_STATUSES, OrderStatus } from '../domain/order-status';

/** Patch an order from the kanban: move stage, edit total or notes. */
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
}
