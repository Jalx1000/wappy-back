import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { ChannelEnum } from './channel.enum';
import { ConnectionStatusEnum } from './connection-status.enum';

export class Connection {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  brandId: number;

  @ApiProperty({ enum: ChannelEnum })
  channel: ChannelEnum;

  @ApiProperty({ type: String })
  accountHandle: string;

  @ApiProperty({ type: String })
  accountId: string;

  @Exclude()
  accessToken: string;

  @Exclude()
  refreshToken: string | null;

  @ApiProperty({ nullable: true })
  expiresAt: Date | null;

  @ApiProperty({ enum: ConnectionStatusEnum })
  status: ConnectionStatusEnum;

  @ApiProperty({ nullable: true })
  lastSyncAt: Date | null;

  @ApiProperty({ type: [String] })
  scopes: string[];

  @ApiProperty({ type: Object })
  metadata: Record<string, unknown>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;
}
