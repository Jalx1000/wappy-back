import { ApiProperty } from '@nestjs/swagger';

export class InstagramConversation {
  @ApiProperty({ type: () => String, nullable: true })
  contactId?: string | null;

  @ApiProperty({ type: () => Date, nullable: true })
  lastMessageAt?: Date | null;

  // The Instagram-Scoped ID (IGSID) of the person we're talking to.
  @ApiProperty({ type: () => String, nullable: false })
  igUserId: string;

  // Optional cache of the peer's @username / display name for the list.
  @ApiProperty({ type: () => String, nullable: true })
  peerUsername?: string | null;

  @ApiProperty({ type: () => Number, nullable: false })
  connectionId: number;

  @ApiProperty({ type: String })
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
