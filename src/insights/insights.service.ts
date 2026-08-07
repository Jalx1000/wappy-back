import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Insight } from './domain/insight';
import { InsightsRepository } from './infrastructure/persistence/relational/repositories/insights.repository';
import { CreateInsightDto } from './dto/create-insight.dto';
import { QUEUE_INSIGHTS } from '../queues/queue-names.constants';

@Injectable()
export class InsightsService {
  constructor(
    private readonly insightsRepo: InsightsRepository,
    @InjectQueue(QUEUE_INSIGHTS) private readonly insightsQueue: Queue,
  ) {}

  async generate(
    brandId: number,
    dto: CreateInsightDto,
  ): Promise<{ jobId: string | undefined }> {
    const now = new Date();
    const period =
      dto.period ??
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const job = await this.insightsQueue.add(
      'generate-insight',
      { brandId, period, connectionId: dto.connectionId ?? null },
      { jobId: `insight-${brandId}-${period}` },
    );
    return { jobId: job.id };
  }

  async findAllForBrand(brandId: number): Promise<Insight[]> {
    return this.insightsRepo.findByBrandId(brandId);
  }
}
