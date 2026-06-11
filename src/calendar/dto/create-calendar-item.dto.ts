import { IsString, IsOptional, IsISO8601, IsObject, IsArray } from 'class-validator';

export class CreateCalendarItemDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsISO8601()
  scheduledAt: string;

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
