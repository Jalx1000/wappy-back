import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import Anthropic from '@anthropic-ai/sdk';
import { QUEUE_INSIGHTS } from '../../queues/queue-names.constants';
import { InsightsRepository } from '../../insights/infrastructure/persistence/relational/repositories/insights.repository';
import { MetricSnapshotsRepository } from '../../metrics/infrastructure/persistence/relational/repositories/metric-snapshots.repository';

interface InsightJobPayload {
  brandId: number;
  period: string;
  connectionId: number | null;
}

interface ParsedInsight {
  summary: string;
  recommendations: string[];
}

@Processor(QUEUE_INSIGHTS)
export class InsightProcessor extends WorkerHost {
  private readonly logger = new Logger(InsightProcessor.name);
  private readonly anthropic: Anthropic;

  constructor(
    private readonly insightsRepo: InsightsRepository,
    private readonly snapshotsRepo: MetricSnapshotsRepository,
    private readonly config: ConfigService,
  ) {
    super();
    this.anthropic = new Anthropic({
      apiKey: this.config.getOrThrow<string>('ANTHROPIC_API_KEY'),
    });
  }

  async process(job: Job<InsightJobPayload>): Promise<void> {
    const { brandId, period, connectionId } = job.data;
    this.logger.log(
      `Generating insight for brand #${brandId}, period ${period}`,
    );

    try {
      const [year, month] = period.split('-').map(Number);
      const from = new Date(year, month - 1, 1);
      const to = new Date(year, month, 0, 23, 59, 59);

      const snapshots = await this.snapshotsRepo.findByBrandAndRange(
        brandId,
        from,
        to,
      );

      if (snapshots.length === 0) {
        this.logger.warn(
          `No metrics found for brand #${brandId} in ${period}, skipping`,
        );
        return;
      }

      const aggregated = this.aggregateForPrompt(
        snapshots as Array<{
          metric: string;
          value: number;
          connectionId: number;
        }>,
      );

      const insight = await this.callClaude(brandId, period, aggregated);

      await this.insightsRepo.upsert({
        brandId,
        connectionId: connectionId ?? null,
        period,
        summary: insight.summary,
        recommendations: insight.recommendations,
      });

      this.logger.log(`Insight saved for brand #${brandId}, period ${period}`);
    } catch (err) {
      this.logger.error(`Insight generation failed for brand #${brandId}`, err);
      throw err;
    }
  }

  private async callClaude(
    brandId: number,
    period: string,
    metrics: Record<string, number>,
  ): Promise<ParsedInsight> {
    const metricsText = Object.entries(metrics)
      .map(([k, v]) => `  ${k}: ${v.toFixed(2)}`)
      .join('\n');

    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: `You are a marketing analytics expert for a digital agency.
Your role is to analyze aggregated social media and advertising metrics and produce
concise, actionable insights for brand managers.

Always respond in valid JSON with exactly two fields:
- "summary": a 2-3 sentence narrative overview of the brand's performance
- "recommendations": an array of 3-5 specific, actionable recommendations

Example format:
{
  "summary": "The brand showed strong growth in reach...",
  "recommendations": [
    "Increase posting frequency on weekdays",
    "Focus budget on top-performing ad campaigns"
  ]
}`,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Analyze the following aggregated metrics for brand #${brandId} in period ${period}:

${metricsText}

Provide insights and recommendations as JSON.`,
        },
      ],
    });

    const text =
      message.content[0].type === 'text' ? message.content[0].text : '';

    return this.parseInsight(text);
  }

  private parseInsight(raw: string): ParsedInsight {
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON object found in Claude response');
      const parsed = JSON.parse(match[0]) as Record<string, unknown>;
      return {
        summary: (parsed['summary'] as string) ?? '',
        recommendations: (parsed['recommendations'] as string[]) ?? [],
      };
    } catch {
      return {
        summary: raw.slice(0, 500),
        recommendations: [],
      };
    }
  }

  private aggregateForPrompt(
    snapshots: Array<{ metric: string; value: number; connectionId: number }>,
  ): Record<string, number> {
    const sums = new Map<string, number>();
    for (const s of snapshots) {
      sums.set(s.metric, (sums.get(s.metric) ?? 0) + s.value);
    }
    return Object.fromEntries(sums);
  }
}
