import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class WhatsappSyncRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;
}
