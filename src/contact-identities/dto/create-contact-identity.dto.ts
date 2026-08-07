import {
  // decorators here

  IsString,
  IsNumber,
  IsOptional,
} from 'class-validator';

import {
  // decorators here
  ApiProperty,
} from '@nestjs/swagger';

export class CreateContactIdentityDto {
  @ApiProperty({
    required: false,
    type: () => String,
  })
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiProperty({
    required: false,
    type: () => String,
  })
  @IsOptional()
  @IsString()
  profileName?: string | null;

  @ApiProperty({
    required: false,
    type: () => String,
  })
  @IsOptional()
  @IsString()
  handle?: string | null;

  @ApiProperty({
    required: true,
    type: () => String,
  })
  @IsString()
  externalId: string;

  @ApiProperty({
    required: false,
    type: () => Number,
  })
  @IsOptional()
  @IsNumber()
  connectionId?: number | null;

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
  contactId: string;

  // Don't forget to use the class-validator decorators in the DTO properties.
}
