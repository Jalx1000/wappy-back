import { ApiProperty } from '@nestjs/swagger';

export class Post {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  brandId: number;

  @ApiProperty({ type: Number })
  connectionId: number;

  @ApiProperty({ type: String })
  externalId: string;

  @ApiProperty()
  publishedAt: Date;

  @ApiProperty({ type: String })
  type: string;

  @ApiProperty({ nullable: true })
  caption: string | null;

  @ApiProperty({ nullable: true })
  mediaUrl: string | null;

  @ApiProperty({ type: Object })
  metrics: Record<string, number>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
