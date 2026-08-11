import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ example: 'acme.com' })
  @IsOptional()
  @IsString()
  domain?: string | null;

  @ApiPropertyOptional({ example: 'Retail' })
  @IsOptional()
  @IsString()
  industry?: string | null;

  @ApiPropertyOptional({ example: 'Madrid, ES' })
  @IsOptional()
  @IsString()
  location?: string | null;

  @ApiPropertyOptional({ example: 'Business' })
  @IsOptional()
  @IsString()
  plan?: string | null;

  @ApiPropertyOptional({ example: 24 })
  @IsOptional()
  @IsInt()
  @Min(0)
  seats?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;
}
