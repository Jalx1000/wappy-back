import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_WHATSAPP_SYNC } from '../../queues/queue-names.constants';
import { WhatsappIngestService } from '../../webhooks/whatsapp-ingest.service';

// Consumes WhatsApp Coexistence `history` webhooks off the request path. A
// single history webhook can describe thousands of messages, so the API webhook
// controller only acks + enqueues; the heavy persistence happens here.
@Processor(QUEUE_WHATSAPP_SYNC)
export class WhatsappHistoryProcessor extends WorkerHost {
  private readonly logger = new Logger(WhatsappHistoryProcessor.name);

  constructor(private readonly ingest: WhatsappIngestService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === 'history') {
      await this.ingest.ingestHistory(job.data);
      return;
    }
    this.logger.warn(`WhatsApp sync: unknown job "${job.name}"`);
  }
}
