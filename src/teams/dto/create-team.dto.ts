import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTeamDto {
  @ApiProperty({ example: 1, description: 'Brand the team belongs to.' })
  @IsInt()
  brandId: number;

  @ApiProperty({ example: 'Soporte' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;
}
