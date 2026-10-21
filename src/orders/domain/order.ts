import { ApiProperty } from '@nestjs/swagger';

export class Order {
  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  notes?: string | null;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  currency?: string;

  @ApiProperty({
    type: () => Number,
    nullable: false,
  })
  total?: number;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  status: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  contactId: string;

  @ApiProperty({
    type: () => Number,
    nullable: false,
  })
  brandId: number;

  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
