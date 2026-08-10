import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  MinLength,
} from 'class-validator';
import { FileDto } from '../../files/dto/file.dto';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from '../../utils/transformers/lower-case.transformer';

export const AVAILABILITY_VALUES = [
  'online',
  'away',
  'busy',
  'offline',
] as const;
export type AvailabilityValue = (typeof AVAILABILITY_VALUES)[number];

export class AuthUpdateDto {
  @ApiPropertyOptional({ type: () => FileDto })
  @IsOptional()
  photo?: FileDto | null;

  @ApiPropertyOptional({ enum: AVAILABILITY_VALUES })
  @IsOptional()
  @IsIn(AVAILABILITY_VALUES)
  availability?: AvailabilityValue;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsNotEmpty({ message: 'mustBeNotEmpty' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsNotEmpty({ message: 'mustBeNotEmpty' })
  lastName?: string;

  @ApiPropertyOptional({ example: 'new.email@example.com' })
  @IsOptional()
  @IsNotEmpty()
  @IsEmail()
  @Transform(lowerCaseTransformer)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty({ message: 'mustBeNotEmpty' })
  oldPassword?: string;
}
