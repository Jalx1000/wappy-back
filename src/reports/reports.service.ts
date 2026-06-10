import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Report } from './domain/report';
import { ReportsRepository } from './infrastructure/persistence/relational/repositories/reports.repository';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportStatusEnum } from './domain/report-status.enum';
import { QUEUE_REPORTS } from '../queues/queue-names.constants';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepo: ReportsRepository,
    @InjectQueue(QUEUE_REPORTS) private readonly reportsQueue: Queue,
  ) {}

  async create(brandId: number, dto: CreateReportDto): Promise<Report> {
    const report = await this.reportsRepo.create({
      brandId,
      type: dto.type,
      status: ReportStatusEnum.pending,
      params: { from: dto.from, to: dto.to, channelIds: dto.channelIds },
      fileUrl: null,
      errorMessage: null,
    });

    await this.reportsQueue.add(
      'generate-report',
      { reportId: report.id, brandId },
      { jobId: `report-${report.id}` },
    );

    return report;
  }

  async findAllForBrand(brandId: number): Promise<Report[]> {
    return this.reportsRepo.findByBrandId(brandId);
  }

  async findOne(brandId: number, id: number): Promise<Report> {
    const report = await this.reportsRepo.findByBrandIdAndId(brandId, id);
    if (!report) throw new NotFoundException(`Report #${id} not found`);
    return report;
  }
}
