import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsArray,
  IsNumber,
  IsString,
} from 'class-validator';
import { ReportTypeEnum } from '../domain/report-type.enum';

export class CreateReportDto {
  @ApiProperty({ enum: ReportTypeEnum })
  @IsEnum(ReportTypeEnum)
  type: ReportTypeEnum;

  @ApiProperty({ example: '2025-01-01' })
  @IsISO8601()
  from: string;

  @ApiProperty({ example: '2025-03-31' })
  @IsISO8601()
  to: string;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  channelIds?: number[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Secciones a incluir (Social, Web, Ads). Vacío = todas.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sections?: string[];
}
