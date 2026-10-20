import { ApiProperty } from '@nestjs/swagger';

export class ConversationState {
  @ApiProperty({
    type: () => Number,
    nullable: true,
  })
  resolvedByUserId?: number | null;

  @ApiProperty({
    type: () => Date,
    nullable: true,
  })
  resolvedAt?: Date | null;

  @ApiProperty({
    type: () => Date,
    nullable: true,
  })
  firstResponseAt?: Date | null;

  @ApiProperty({
    type: () => Date,
    nullable: true,
  })
  firstInboundAt?: Date | null;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  status: string;

  @ApiProperty({
    type: () => Number,
    nullable: false,
  })
  brandId: number;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  channel: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  conversationId: string;

  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
