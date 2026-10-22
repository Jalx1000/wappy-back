import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

/** Public WhatsApp send payload (brief §2C). */
export class SendWhatsappDto {
  @ApiProperty({ description: 'E.164, e.g. +59170000000' })
  @IsString()
  to: string;

  @ApiPropertyOptional({ description: 'Pre-approved template name' })
  @IsOptional()
  @IsString()
  template?: string | null;

  @ApiPropertyOptional({
    type: () => [String],
    description: 'Positional body params',
  })
  @IsOptional()
  @IsArray()
  params?: string[] | null;

  @ApiPropertyOptional({ description: 'Template language code (default es)' })
  @IsOptional()
  @IsString()
  language?: string | null;

  @ApiPropertyOptional({
    description: 'Free text (only within the 24h window)',
  })
  @IsOptional()
  @IsString()
  text?: string | null;
}
