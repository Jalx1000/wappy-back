import { IsString, IsOptional, IsArray, IsObject } from 'class-validator';

export class CreateAssetDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsString()
  mimeType: string;

  @IsOptional()
  @IsString()
  fileId?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
