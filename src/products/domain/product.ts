import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Brand } from '../../brands/domain/brand';

export type ProductAttributeType =
  | 'text'
  | 'number'
  | 'decimal'
  | 'currency'
  | 'percent'
  | 'boolean'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'email'
  | 'phone'
  | 'url';

/** One typed custom attribute. See docs/contracts/products-sync.md §3. */
export class ProductAttribute {
  @ApiProperty()
  key: string;

  @ApiProperty()
  label: string;

  @ApiProperty({
    enum: [
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
    ],
  })
  type: ProductAttributeType;

  @ApiProperty()
  value: string | number | boolean | string[] | null;

  @ApiPropertyOptional({ type: [String] })
  options?: string[];

  @ApiPropertyOptional()
  required?: boolean;
}

export class Product {
  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty({ type: 'number' })
  price: number;

  @ApiProperty()
  stock: number;

  @ApiPropertyOptional()
  image?: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  category: string;

  @ApiPropertyOptional()
  externalId?: string | null;

  @ApiPropertyOptional({ type: () => [ProductAttribute] })
  attributes?: ProductAttribute[] | null;

  @ApiProperty()
  brandId: number;

  @ApiPropertyOptional({ type: () => Brand })
  brand?: Brand;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
