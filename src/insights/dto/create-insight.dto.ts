import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsNumber } from 'class-validator';

export class CreateInsightDto {
  @ApiPropertyOptional({
    example: '2025-03',
    description: 'YYYY-MM period. Defaults to current month.',
  })
  @IsOptional()
  @IsISO8601()
  period?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  connectionId?: number;
}
