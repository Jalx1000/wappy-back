import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class AssignStrandedDto {
  @ApiProperty({ type: Number, example: 12 })
  @IsInt()
  brandId: number;
}
