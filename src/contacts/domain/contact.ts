import { ApiProperty } from '@nestjs/swagger';

export class Contact {
  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  mergedIntoContactId?: string | null;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  notes?: string | null;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  avatarUrl?: string | null;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  email?: string | null;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  phone?: string | null;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  displayName?: string | null;

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
