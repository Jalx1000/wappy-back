import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class OrderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;
}
