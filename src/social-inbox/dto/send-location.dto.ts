import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SendLocationDto {
  @ApiProperty({ example: 'whatsapp' })
  @IsString()
  @IsNotEmpty()
  channel: string;

  @ApiProperty({ example: -17.7833 })
  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: -63.1821 })
  @Type(() => Number)
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ example: 'Plaza 24 de Septiembre' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Santa Cruz de la Sierra' })
  @IsOptional()
  @IsString()
  address?: string;
}
