import { ApiProperty } from '@nestjs/swagger';
import { MetricEnum } from './metric.enum';

export class MetricSnapshot {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  connectionId: number;

  @ApiProperty({ type: Number })
  brandId: number;

  @ApiProperty()
  date: Date;

  @ApiProperty({ enum: MetricEnum })
  metric: MetricEnum;

  @ApiProperty({ type: Number })
  value: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
