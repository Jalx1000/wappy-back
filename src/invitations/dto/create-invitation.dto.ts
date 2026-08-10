import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from '../../utils/transformers/lower-case.transformer';

const ROLES = ['admin', 'member', 'client'] as const;

export class CreateInvitationDto {
  @ApiProperty({ example: 1, description: 'Brand the person is invited to.' })
  @IsInt()
  brandId: number;

  @ApiPropertyOptional({ example: 'jane@example.com' })
  @ValidateIf((o) => !o.phone)
  @IsEmail()
  @Transform(lowerCaseTransformer)
  email?: string | null;

  @ApiPropertyOptional({ example: '+59170000000' })
  @ValidateIf((o) => !o.email)
  @IsString()
  phone?: string | null;

  @ApiPropertyOptional({ enum: ROLES, default: 'member' })
  @IsOptional()
  @IsIn(ROLES)
  role?: string;
}
