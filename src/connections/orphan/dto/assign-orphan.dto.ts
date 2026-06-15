import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class AssignOrphanDto {
  @ApiProperty({ type: Number, example: 10 })
  @IsInt()
  brandId: number;
}
