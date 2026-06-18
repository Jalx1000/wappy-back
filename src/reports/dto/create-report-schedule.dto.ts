import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ReportFrequencyEnum } from '../domain/report-frequency.enum';

export class CreateReportScheduleDto {
  @ApiProperty({ enum: ReportFrequencyEnum })
  @IsEnum(ReportFrequencyEnum)
  frequency: ReportFrequencyEnum;

  @ApiPropertyOptional({ description: '0 (Sun) – 6 (Sat), for weekly/biweekly' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ApiPropertyOptional({ description: '1 – 28, for monthly/quarterly' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(28)
  dayOfMonth?: number;

  @ApiProperty({ description: 'Hour of day 0 – 23 in the schedule timezone' })
  @IsInt()
  @Min(0)
  @Max(23)
  hour: number;

  @ApiPropertyOptional({ default: 'America/La_Paz' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sections?: string[];

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  memberUserIds?: number[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  extraEmails?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
