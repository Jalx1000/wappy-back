import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class AssignConversationDto {
  @ApiProperty({ description: 'Conversation channel (whatsapp/instagram/…).' })
  @IsString()
  channel: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Agent user id to assign, or null to clear.',
  })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsInt()
  assigneeUserId?: number | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Team id to assign, or null to clear.',
  })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsUUID()
  teamId?: string | null;
}
