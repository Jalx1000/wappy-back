import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

class BrandInProductDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  slug: string;
}

export class ProductDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ type: 'number' })
  @IsNumber({}, { message: 'Price must be a valid number' })
  @IsPositive()
  price: number;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  stock: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string | null;

  @ApiProperty()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  brandId: number;

  @ApiPropertyOptional({ type: () => BrandInProductDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BrandInProductDto)
  brand?: BrandInProductDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
