import { ApiProperty } from '@nestjs/swagger';

export class Company {
  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  notes?: string | null;

  @ApiProperty({
    type: () => Number,
    nullable: true,
  })
  seats?: number | null;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  plan?: string | null;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  location?: string | null;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  industry?: string | null;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  domain?: string | null;

  @ApiProperty({
    type: () => Number,
    nullable: false,
  })
  brandId?: number;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  name: string;

  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
