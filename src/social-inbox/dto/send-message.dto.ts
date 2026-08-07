import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: 'whatsapp' })
  @IsString()
  @IsNotEmpty()
  channel: string;

  @ApiProperty({ example: 'Hola, ¿en qué te ayudo?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  text: string;
}
