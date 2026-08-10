import { ApiProperty } from '@nestjs/swagger';

export class ConversationAssignment {
  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  assignedTeamId?: string | null;

  @ApiProperty({
    type: () => Number,
    nullable: true,
  })
  assignedUserId?: number | null;

  @ApiProperty({
    type: () => Number,
    nullable: false,
  })
  brandId?: number;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  channel?: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  conversationId?: string;

  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
