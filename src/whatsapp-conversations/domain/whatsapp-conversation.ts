import { ApiProperty } from '@nestjs/swagger';

export class WhatsappConversation {
  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  contactId?: string | null;

  @ApiProperty({
    type: () => Date,
    nullable: true,
  })
  lastMessageAt?: Date | null;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  waUserPhone: string;

  @ApiProperty({
    type: () => Number,
    nullable: false,
  })
  connectionId: number;

  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
