import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

/**
 * Public upsert payload (brief §2A). At least one of email/phone is required;
 * the controller enforces that. `list_id` is accepted and folded into tags.
 */
export class UpsertContactDto {
  @ApiPropertyOptional()
  @ValidateIf((o) => o.email !== undefined && o.email !== null)
  @IsEmail({}, { message: 'invalid_email' })
  email?: string | null;

  @ApiPropertyOptional({ description: 'E.164, e.g. +59170000000' })
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string | null;

  @ApiPropertyOptional({ description: 'newsletter | checkout | contacto' })
  @IsOptional()
  @IsString()
  source?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  list_id?: string | null;

  @ApiPropertyOptional({ type: () => [String] })
  @IsOptional()
  @IsArray()
  tags?: string[] | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  consent?: Record<string, unknown> | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown> | null;
}
