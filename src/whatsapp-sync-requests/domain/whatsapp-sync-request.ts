import { ApiProperty } from '@nestjs/swagger';

export class WhatsappSyncRequest {
  @ApiProperty({
    type: () => Number,
    nullable: true,
  })
  progress?: number | null;

  @ApiProperty({
    type: () => Number,
    nullable: true,
  })
  phase?: number | null;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  status?: string | null;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  syncType: string;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  requestId?: string | null;

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
