import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConversationAssignmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;
}
