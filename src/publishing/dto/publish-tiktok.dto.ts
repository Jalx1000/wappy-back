import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export enum PublishMode {
  direct = 'direct',
  inbox = 'inbox',
}

export enum TiktokPrivacy {
  PUBLIC_TO_EVERYONE = 'PUBLIC_TO_EVERYONE',
  MUTUAL_FOLLOW_FRIENDS = 'MUTUAL_FOLLOW_FRIENDS',
  FOLLOWER_OF_CREATOR = 'FOLLOWER_OF_CREATOR',
  SELF_ONLY = 'SELF_ONLY',
}

export class PublishTiktokDto {
  @ApiProperty({ description: 'Asset id holding the video to publish' })
  @IsInt()
  assetId: number;

  @ApiProperty({ enum: PublishMode })
  @IsEnum(PublishMode)
  mode: PublishMode;

  @ApiPropertyOptional({ description: 'Caption / title (direct post only)' })
  @IsOptional()
  @IsString()
  @MaxLength(2200)
  title?: string;

  @ApiPropertyOptional({ enum: TiktokPrivacy })
  @IsOptional()
  @IsEnum(TiktokPrivacy)
  privacyLevel?: TiktokPrivacy;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  disableComment?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  disableDuet?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  disableStitch?: boolean;
}
