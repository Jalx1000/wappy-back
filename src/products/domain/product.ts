import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Brand } from '../../brands/domain/brand';

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

  @ApiProperty()
  brandId: number;

  @ApiPropertyOptional({ type: () => Brand })
  brand?: Brand;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
