import { ApiProperty } from '@nestjs/swagger';

export class Invitation {
  @ApiProperty({
    type: () => Number,
    nullable: true,
  })
  invitedByUserId?: number | null;

  @ApiProperty({
    type: () => Number,
    nullable: false,
  })
  brandId?: number;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  status?: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  token?: string;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  role?: string | null;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  phone?: string | null;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  email?: string | null;

  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
