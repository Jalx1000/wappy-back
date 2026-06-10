import { ApiProperty } from '@nestjs/swagger';

export enum BrandMemberRoleEnum {
  admin = 'admin',
  member = 'member',
  client = 'client',
}

export class BrandMembership {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  userId: number;

  @ApiProperty({ type: Number })
  brandId: number;

  @ApiProperty({ enum: BrandMemberRoleEnum })
  role: BrandMemberRoleEnum;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
