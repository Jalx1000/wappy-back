import { ApiProperty } from '@nestjs/swagger';

export class WebhookEndpoint {
  @ApiProperty({
    type: () => Boolean,
    nullable: false,
  })
  active?: boolean;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  secret: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  url: string;

  @ApiProperty({
    type: () => Number,
    nullable: false,
  })
  brandId: number;

  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
