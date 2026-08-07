import { ApiProperty } from '@nestjs/swagger';

export class ContactIdentity {
  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  phone?: string | null;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  profileName?: string | null;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  handle?: string | null;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  externalId: string;

  @ApiProperty({
    type: () => Number,
    nullable: true,
  })
  connectionId?: number | null;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  channel: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  contactId: string;

  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
