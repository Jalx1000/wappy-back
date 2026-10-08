import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
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

  @ApiPropertyOptional({
    enum: ['anthropic', 'openai'],
    default: 'anthropic',
    description: "LLM provider: 'anthropic' (Claude) or 'openai' (ChatGPT).",
  })
  @IsOptional()
  @IsIn(['anthropic', 'openai'])
  provider?: string;

  @ApiPropertyOptional({
    description:
      'Model id. Defaults to claude-sonnet-4-6 (anthropic) or gpt-4o-mini (openai).',
  })
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
