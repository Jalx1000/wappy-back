import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsObject,
  IsDateString,
} from 'class-validator';
import { ChannelEnum } from '../domain/channel.enum';

export class CreateConnectionDto {
  @ApiProperty({ enum: ChannelEnum })
  @IsEnum(ChannelEnum)
  channel: ChannelEnum;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  accountHandle: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
