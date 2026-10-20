import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConversationStateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;
}
