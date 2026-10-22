import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const API_KEY_ENVIRONMENTS = ['sandbox', 'production'] as const;

/** Admin request to mint a new API key for the current brand. */
export class CreateApiKeyDto {
  @ApiProperty({ enum: API_KEY_ENVIRONMENTS })
  @IsIn(API_KEY_ENVIRONMENTS)
  environment: 'sandbox' | 'production';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string | null;
}
