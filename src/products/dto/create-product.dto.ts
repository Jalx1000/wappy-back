import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'SKU-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  sku: string;

  @ApiProperty({ example: 'iPhone 15 Pro' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'Descripción del producto' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string | null;

  @ApiProperty({ example: 99.99 })
  @IsNumber({}, { message: 'Price must be a valid number' })
  @IsPositive({ message: 'Price must be positive' })
  price: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt({ message: 'Stock must be an integer' })
  @Min(1, { message: 'Stock must be at least 1' })
  stock?: number;

  @ApiPropertyOptional({ example: 'https://...' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  image?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: 'Electronics' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  category: string;

  @ApiProperty({ example: 1 })
  @IsInt({ message: 'brandId must be a valid number' })
  @IsPositive({ message: 'brandId is required' })
  brandId: number;
}
