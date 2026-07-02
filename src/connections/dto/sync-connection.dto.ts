import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

// Optional custom window for a manual sync. Without it the sync keeps its
// default 90-day backfill window.
export class SyncConnectionDto {
  @ApiPropertyOptional({ type: String, example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ type: String, example: '2026-03-31' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
