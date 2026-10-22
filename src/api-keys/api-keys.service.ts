import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { ApiKeyRepository } from './infrastructure/persistence/api-key.repository';
import { ApiKey } from './domain/api-key';
import { BrandsService } from '../brands/brands.service';
import { Brand } from '../brands/domain/brand';

export type ApiKeyEnvironment = 'sandbox' | 'production';

@Injectable()
export class ApiKeysService {
  constructor(
    private readonly apiKeyRepository: ApiKeyRepository,
    private readonly brandsService: BrandsService,
  ) {}

  private hash(plaintext: string): string {
    return createHash('sha256').update(plaintext).digest('hex');
  }

  /**
   * Creates a key for a brand. Returns the record plus the PLAINTEXT key, which
   * is shown once and never stored (only its SHA-256 hash + a masked prefix).
   */
  async generateForBrand(
    brandId: number,
    environment: ApiKeyEnvironment,
    label?: string | null,
  ): Promise<{ apiKey: ApiKey; plaintext: string }> {
    const token = randomBytes(24).toString('hex');
    const plaintext = `wppy_${environment === 'production' ? 'live' : 'test'}_${token}`;
    const keyPrefix = `${plaintext.slice(0, 10)}…${plaintext.slice(-4)}`;
    const apiKey = await this.apiKeyRepository.create({
      brandId,
      environment,
      label: label ?? null,
      keyHash: this.hash(plaintext),
      keyPrefix,
      lastUsedAt: null,
      revokedAt: null,
    });
    return { apiKey, plaintext };
  }

  /** Resolves the brand for a plaintext key (auth path). Null if invalid/revoked. */
  async resolveBrand(plaintext: string): Promise<Brand | null> {
    const record = await this.apiKeyRepository.findByHash(this.hash(plaintext));
    if (!record || record.revokedAt) return null;
    const brand = await this.brandsService.getBrandById(record.brandId);
    if (!brand) return null;
    // Best-effort last-used stamp; never blocks the request.
    void this.apiKeyRepository.update(record.id, { lastUsedAt: new Date() });
    return brand;
  }

  listForBrand(brandId: number): Promise<ApiKey[]> {
    return this.apiKeyRepository.findByBrand(brandId);
  }

  /** Soft-revokes a brand-owned key (idempotent). 404 if not the brand's. */
  async revokeForBrand(brandId: number, id: string): Promise<void> {
    const record = await this.apiKeyRepository.findById(id);
    if (!record || record.brandId !== brandId) {
      throw new NotFoundException('API key not found');
    }
    if (!record.revokedAt) {
      await this.apiKeyRepository.update(id, { revokedAt: new Date() });
    }
  }
}
