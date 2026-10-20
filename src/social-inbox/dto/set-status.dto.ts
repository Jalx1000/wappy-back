import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export const CONVERSATION_STATUSES = [
  'open',
  'pending',
  'resolved',
  'snoozed',
] as const;

export class SetStatusDto {
  @ApiProperty({ example: 'whatsapp' })
  @IsString()
  channel: string;

  @ApiProperty({ enum: CONVERSATION_STATUSES, example: 'resolved' })
  @IsIn(CONVERSATION_STATUSES)
  status: string;
}
