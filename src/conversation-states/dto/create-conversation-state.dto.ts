import {
  // decorators here

  IsString,
  IsNumber,
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

export class CreateConversationStateDto {
  @ApiProperty({
    required: false,
    type: () => Number,
  })
  @IsOptional()
  @IsNumber()
  resolvedByUserId?: number | null;

  @ApiProperty({
    required: false,
    type: () => Date,
  })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  resolvedAt?: Date | null;

  @ApiProperty({
    required: false,
    type: () => Date,
  })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  firstResponseAt?: Date | null;

  @ApiProperty({
    required: false,
    type: () => Date,
  })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  firstInboundAt?: Date | null;

  @ApiProperty({
    required: true,
    type: () => String,
  })
  @IsString()
  status: string;

  @ApiProperty({
    required: true,
    type: () => Number,
  })
  @IsNumber()
  brandId: number;

  @ApiProperty({
    required: true,
    type: () => String,
  })
  @IsString()
  channel: string;

  @ApiProperty({
    required: true,
    type: () => String,
  })
  @IsString()
  conversationId: string;

  // Don't forget to use the class-validator decorators in the DTO properties.
}
