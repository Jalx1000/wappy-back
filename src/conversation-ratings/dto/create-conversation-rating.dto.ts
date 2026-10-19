import {
  // decorators here

  IsNumber,
  IsString,
  IsOptional,
} from 'class-validator';

import {
  // decorators here
  ApiProperty,
} from '@nestjs/swagger';

export class CreateConversationRatingDto {
  @ApiProperty({
    required: false,
    type: () => String,
  })
  @IsOptional()
  @IsString()
  comment?: string | null;

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
  conversationId: string;

  @ApiProperty({
    required: true,
    type: () => String,
  })
  @IsString()
  channel: string;

  @ApiProperty({
    required: true,
    type: () => Number,
  })
  @IsNumber()
  score: number;

  // Don't forget to use the class-validator decorators in the DTO properties.
}
