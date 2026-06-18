import { ApiProperty } from '@nestjs/swagger';
import { ReportFrequencyEnum } from './report-frequency.enum';
import { ReportTypeEnum } from './report-type.enum';

export class ReportSchedule {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  brandId: number;

  @ApiProperty({ enum: ReportTypeEnum })
  type: ReportTypeEnum;

  @ApiProperty({ enum: ReportFrequencyEnum })
  frequency: ReportFrequencyEnum;

  // 0 (Sunday) – 6 (Saturday); used by weekly/biweekly.
  @ApiProperty({ type: Number, nullable: true })
  dayOfWeek: number | null;

  // 1 – 28; used by monthly/quarterly.
  @ApiProperty({ type: Number, nullable: true })
  dayOfMonth: number | null;

  // Hour of day 0 – 23 in the schedule timezone.
  @ApiProperty({ type: Number })
  hour: number;

  @ApiProperty({ type: String })
  timezone: string;

  @ApiProperty({ type: [String] })
  sections: string[];

  @ApiProperty({ type: [Number] })
  memberUserIds: number[];

  @ApiProperty({ type: [String] })
  extraEmails: string[];

  @ApiProperty({ type: Boolean })
  enabled: boolean;

  @ApiProperty({ type: Date, nullable: true })
  lastRunAt: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  nextRunAt: Date | null;

  @ApiProperty({ type: Number, nullable: true })
  createdByUserId: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
