import { ApiProperty } from '@nestjs/swagger';
import { ReportTypeEnum } from './report-type.enum';
import { ReportStatusEnum } from './report-status.enum';

export interface ReportParams {
  from: string;
  to: string;
  channelIds?: number[];
}

export class Report {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  brandId: number;

  @ApiProperty({ enum: ReportTypeEnum })
  type: ReportTypeEnum;

  @ApiProperty({ enum: ReportStatusEnum })
  status: ReportStatusEnum;

  @ApiProperty()
  params: ReportParams;

  @ApiProperty({ type: String, nullable: true })
  fileUrl: string | null;

  @ApiProperty({ type: String, nullable: true })
  errorMessage: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
