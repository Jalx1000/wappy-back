import { ApiProperty } from '@nestjs/swagger';

export class ApiKey {
  @ApiProperty({
    type: () => Date,
    nullable: true,
  })
  revokedAt?: Date | null;

  @ApiProperty({
    type: () => Date,
    nullable: true,
  })
  lastUsedAt?: Date | null;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  label?: string | null;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  environment: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  keyPrefix: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  keyHash: string;

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
