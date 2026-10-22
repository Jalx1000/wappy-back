import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsObject, IsOptional, IsString } from 'class-validator';

/** Public transactional email payload (brief §2B). */
export class SendEmailDto {
  @ApiProperty()
  @IsEmail({}, { message: 'invalid_email' })
  to: string;

  @ApiPropertyOptional({ description: 'Named template, e.g. "bienvenida"' })
  @IsOptional()
  @IsString()
  template?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  variables?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: 'Raw send: subject (with html)' })
  @IsOptional()
  @IsString()
  subject?: string | null;

  @ApiPropertyOptional({ description: 'Raw send: html body (with subject)' })
  @IsOptional()
  @IsString()
  html?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail({}, { message: 'invalid_reply_to' })
  reply_to?: string | null;
}
