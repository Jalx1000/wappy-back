import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAgentDto {
  @ApiProperty()
  @IsInt()
  brandId: number;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ default: 'claude-sonnet-4-6' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  systemPrompt?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'low|medium|high' })
  @IsOptional()
  @IsString()
  effort?: string | null;

  @ApiPropertyOptional({ type: [String], nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  toolsEnabled?: string[] | null;
}
