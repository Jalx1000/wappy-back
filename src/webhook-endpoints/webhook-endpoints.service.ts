import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { WebhookEndpointRepository } from './infrastructure/persistence/webhook-endpoint.repository';
import { WebhookEndpoint } from './domain/webhook-endpoint';

@Injectable()
export class WebhookEndpointsService {
  constructor(
    private readonly webhookEndpointRepository: WebhookEndpointRepository,
  ) {}

  /** Registers a webhook target for a brand, generating its signing secret. */
  async createForBrand(brandId: number, url: string): Promise<WebhookEndpoint> {
    return this.webhookEndpointRepository.create({
      brandId,
      url,
      secret: `whsec_${randomBytes(24).toString('hex')}`,
      active: true,
    });
  }

  listForBrand(brandId: number): Promise<WebhookEndpoint[]> {
    return this.webhookEndpointRepository.findActiveByBrand(brandId);
  }

  /** Deletes a brand-owned endpoint (404 if not the brand's). */
  async removeForBrand(brandId: number, id: string): Promise<void> {
    const endpoint = await this.webhookEndpointRepository.findById(id);
    if (!endpoint || endpoint.brandId !== brandId) {
      throw new NotFoundException('Webhook endpoint not found');
    }
    await this.webhookEndpointRepository.remove(id);
  }
}
