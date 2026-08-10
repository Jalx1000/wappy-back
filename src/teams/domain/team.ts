import { User } from '../../users/domain/user';
import { ApiProperty } from '@nestjs/swagger';

export class Team {
  @ApiProperty({
    type: () => [User],
    nullable: false,
  })
  members?: User[];

  @ApiProperty({
    type: () => Number,
    nullable: false,
  })
  brandId?: number;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  name: string;

  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
