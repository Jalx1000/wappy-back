import {
  // decorators here

  IsNumber,
  IsString,
  IsOptional,
  IsDate,
} from 'class-validator';

import {
  // decorators here
  ApiProperty,
} from '@nestjs/swagger';

import {
  // decorators here

  Transform,
} from 'class-transformer';

export class CreateWhatsappMessageDto {
  @ApiProperty({
    required: true,
    type: () => Date,
  })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  sentAt: Date;

  @ApiProperty({
    required: false,
    type: () => Date,
  })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  revokedAt?: Date | null;

  @ApiProperty({
    required: false,
    type: () => String,
  })
  @IsOptional()
  @IsString()
  editedFromId?: string | null;

  @ApiProperty({
    required: true,
    type: () => String,
  })
  @IsString()
  source: string;

  @ApiProperty({
    required: false,
    type: () => String,
  })
  @IsOptional()
  @IsString()
  status?: string | null;

  @ApiProperty({
    required: false,
    type: () => String,
  })
  @IsOptional()
  @IsString()
  mediaUrl?: string | null;

  @ApiProperty({
    required: false,
    type: () => String,
  })
  @IsOptional()
  @IsString()
  mediaId?: string | null;

  @ApiProperty({
    required: false,
    type: () => String,
  })
  @IsOptional()
  @IsString()
  content?: string | null;

  @ApiProperty({
    required: true,
    type: () => String,
  })
  @IsString()
  messageType: string;

  @ApiProperty({
    required: true,
    type: () => String,
  })
  @IsString()
  direction: string;

  @ApiProperty({
    required: true,
    type: () => String,
  })
  @IsString()
  externalId: string;

  @ApiProperty({
    required: true,
    type: () => String,
  })
  @IsString()
  conversationId: string;

  @ApiProperty({
    required: true,
    type: () => Number,
  })
  @IsNumber()
  connectionId: number;

  // Don't forget to use the class-validator decorators in the DTO properties.
}
