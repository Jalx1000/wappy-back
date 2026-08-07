import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { BrandMemberRoleEnum } from '../domain/brand-membership';

export class AddMemberDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  userId: number;

  @ApiPropertyOptional({
    enum: BrandMemberRoleEnum,
    default: BrandMemberRoleEnum.member,
  })
  @IsOptional()
  @IsEnum(BrandMemberRoleEnum)
  role?: BrandMemberRoleEnum;
}
