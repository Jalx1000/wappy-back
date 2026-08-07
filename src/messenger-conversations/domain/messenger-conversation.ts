import { ApiProperty } from '@nestjs/swagger';

export class MessengerConversation {
  @ApiProperty({ type: () => String, nullable: true })
  contactId?: string | null;

  @ApiProperty({ type: () => Date, nullable: true })
  lastMessageAt?: Date | null;

  // The Page-Scoped ID (PSID) of the person messaging the Facebook Page.
  @ApiProperty({ type: () => String, nullable: false })
  psid: string;

  // Optional cache of the peer's display name for the conversation list.
  @ApiProperty({ type: () => String, nullable: true })
  peerName?: string | null;

  @ApiProperty({ type: () => Number, nullable: false })
  connectionId: number;

  @ApiProperty({ type: String })
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
