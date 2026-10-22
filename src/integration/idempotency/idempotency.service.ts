import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface StoredResponse {
  statusCode: number;
  body: unknown;
}

/**
 * Idempotency for the public API: the first response to an `Idempotency-Key` is
 * cached (per brand) and replayed on retries, so a network retry never creates a
 * duplicate contact/message. Backed by Redis with a 24h TTL.
 */
@Injectable()
export class IdempotencyService implements OnModuleDestroy {
  private readonly redis: Redis;
  private static readonly TTL = 60 * 60 * 24; // 24h
  private static readonly PREFIX = 'idem:';

  constructor(private readonly config: ConfigService) {
    this.redis = new Redis(this.config.getOrThrow<string>('REDIS_URL'));
  }

  private keyFor(brandId: number, idempotencyKey: string): string {
    return `${IdempotencyService.PREFIX}${brandId}:${idempotencyKey}`;
  }

  async get(
    brandId: number,
    idempotencyKey: string,
  ): Promise<StoredResponse | null> {
    const raw = await this.redis.get(this.keyFor(brandId, idempotencyKey));
    return raw ? (JSON.parse(raw) as StoredResponse) : null;
  }

  async store(
    brandId: number,
    idempotencyKey: string,
    response: StoredResponse,
  ): Promise<void> {
    await this.redis.setex(
      this.keyFor(brandId, idempotencyKey),
      IdempotencyService.TTL,
      JSON.stringify(response),
    );
  }

  onModuleDestroy(): void {
    void this.redis.quit();
  }
}
