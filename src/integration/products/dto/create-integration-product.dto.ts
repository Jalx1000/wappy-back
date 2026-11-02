import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  Allow,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ProductAttributeType } from '../../../products/domain/product';

const ATTRIBUTE_TYPES: ProductAttributeType[] = [
  'text',
  'number',
  'decimal',
  'currency',
  'percent',
  'boolean',
  'date',
  'select',
  'multiselect',
  'email',
  'phone',
  'url',
];

/** One typed custom attribute, as sent by the plugin. See contract §3. */
export class IntegrationProductAttributeDto {
  @ApiProperty()
  @IsString()
  key: string;

  @ApiProperty()
  @IsString()
  label: string;

  @ApiProperty({ enum: ATTRIBUTE_TYPES })
  @IsIn(ATTRIBUTE_TYPES)
  type: ProductAttributeType;

  @ApiProperty()
  @Allow()
  value: string | number | boolean | string[] | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  required?: boolean;
}

/**
 * Public product payload (contract §2). The external store upserts by
 * `external_id`; `description` is capped at 255 chars by the current schema.
 */
export class CreateIntegrationProductDto {
  @ApiProperty({ description: 'External product id (upsert key), e.g. wc_128' })
  @IsString()
  external_id: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  sku: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string | null;

  @ApiProperty({ example: 180.0 })
  @IsNumber()
  price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  stock?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  image?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  category: string;

  @ApiPropertyOptional({ type: () => [IntegrationProductAttributeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IntegrationProductAttributeDto)
  attributes?: IntegrationProductAttributeDto[] | null;

  @ApiPropertyOptional({
    description: 'Change origin; "woocommerce" when sent via this API',
  })
  @IsOptional()
  @IsString()
  origin?: string | null;
}
