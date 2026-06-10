import { ApiProperty } from '@nestjs/swagger';

export class Insight {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  brandId: number;

  @ApiProperty({ type: Number, nullable: true })
  connectionId: number | null;

  @ApiProperty({ type: String })
  period: string;

  @ApiProperty({ type: String })
  summary: string;

  @ApiProperty({ type: [String] })
  recommendations: string[];

  @ApiProperty()
  createdAt: Date;
}
