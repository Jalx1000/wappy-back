import { ApiProperty } from '@nestjs/swagger';

export class MessengerMessage {
  @ApiProperty({ type: () => Object, nullable: true })
  payload?: Record<string, unknown> | null;

  @ApiProperty({ type: () => Date, nullable: false })
  sentAt: Date;

  @ApiProperty({ type: () => Date, nullable: true })
  revokedAt?: Date | null;

  @ApiProperty({ type: () => String, nullable: true })
  editedFromId?: string | null;

  // live | echo | history
  @ApiProperty({ type: () => String, nullable: false })
  source: string;

  @ApiProperty({ type: () => String, nullable: true })
  status?: string | null;

  @ApiProperty({ type: () => String, nullable: true })
  mediaUrl?: string | null;

  @ApiProperty({ type: () => String, nullable: true })
  mediaId?: string | null;

  @ApiProperty({ type: () => String, nullable: true })
  content?: string | null;

  @ApiProperty({ type: () => String, nullable: false })
  messageType: string;

  @ApiProperty({ type: () => String, nullable: false })
  direction: string;

  // Messenger message id (mid) — idempotency key within a connection.
  @ApiProperty({ type: () => String, nullable: false })
  externalId: string;

  @ApiProperty({ type: () => String, nullable: false })
  conversationId: string;

  @ApiProperty({ type: () => Number, nullable: false })
  connectionId: number;

  @ApiProperty({ type: String })
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
