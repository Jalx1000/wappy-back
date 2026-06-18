import { ApiProperty } from '@nestjs/swagger';
import { ReportTypeEnum } from './report-type.enum';
import { ReportStatusEnum } from './report-status.enum';

export interface ReportParams {
  from: string;
  to: string;
  channelIds?: number[];
  sections?: string[];
}

export interface ReportKpi {
  key: string;
  label: string;
  value: number;
  unit?: 'number' | 'percent' | 'currency';
  deltaPct?: number | null;
  series?: Array<{ date: string; value: number }>;
}

export interface ReportTopPost {
  externalId: string;
  channel?: string;
  publishedAt: string | Date;
  type: string;
  caption: string | null;
  mediaUrl: string | null;
  metrics: Record<string, number>;
}

export interface ReportNetworkSection {
  channel: string;
  label: string;
  handle?: string | null;
  kpis: ReportKpi[];
  topPosts: ReportTopPost[];
  note?: string;
}

export interface ReportData {
  brand: { id: number; name: string; logoUrl?: string | null };
  period: { from: string; to: string; label: string };
  generatedAt: string;
  sections: string[];
  executive: {
    kpis: ReportKpi[];
    narrative: string[];
    postsTable: Array<Record<string, string | number | null>>;
  };
  social?: { networks: ReportNetworkSection[] };
  web?: {
    kpis: ReportKpi[];
    sources: Array<{ label: string; value: number }>;
    countries: Array<{
      country: string;
      sessions: number;
      users: number;
      conversions: number;
    }>;
    cities: Array<{ city: string; sessions: number }>;
  };
  ads?: {
    kpis: ReportKpi[];
    campaigns: Array<Record<string, string | number | null>>;
  };
  conclusions: string[];
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

  @ApiProperty({ type: Object, nullable: true })
  data: ReportData | null;

  @ApiProperty({ type: String, nullable: true })
  errorMessage: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
