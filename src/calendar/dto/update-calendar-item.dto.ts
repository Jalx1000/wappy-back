import {
  IsOptional,
  IsString,
  IsISO8601,
  IsObject,
  IsArray,
} from 'class-validator';

export class UpdateCalendarItemDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsArray()
  mediaUrls?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
