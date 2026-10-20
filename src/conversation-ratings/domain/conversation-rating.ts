import { ApiProperty } from '@nestjs/swagger';

export class ConversationRating {
  @ApiProperty({
    type: () => Number,
    nullable: true,
  })
  agentUserId?: number | null;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  comment?: string | null;

  @ApiProperty({
    type: () => Number,
    nullable: false,
  })
  brandId: number;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  conversationId: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  channel: string;

  @ApiProperty({
    type: () => Number,
    nullable: false,
  })
  score: number;

  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
