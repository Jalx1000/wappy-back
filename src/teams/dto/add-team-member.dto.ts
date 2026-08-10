import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class AddTeamMemberDto {
  @ApiProperty({ example: 4 })
  @IsInt()
  userId: number;
}
