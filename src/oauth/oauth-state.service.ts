import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import Redis from 'ioredis';

export interface OAuthStateData {
  brandId: number;
  userId: number;
  channel: string;
}

@Injectable()
export class OAuthStateService implements OnModuleDestroy {
  private readonly redis: Redis;
  private static readonly TTL = 600;
  private static readonly PREFIX = 'oauth_state:';

  constructor(private readonly config: ConfigService) {
    this.redis = new Redis(this.config.getOrThrow<string>('REDIS_URL'));
  }

  async generate(data: OAuthStateData): Promise<string> {
    const state = crypto.randomBytes(32).toString('hex');
    await this.redis.setex(
      `${OAuthStateService.PREFIX}${state}`,
      OAuthStateService.TTL,
      JSON.stringify(data),
    );
    return state;
  }

  async validateAndConsume(state: string): Promise<OAuthStateData | null> {
    const raw = await this.redis.getdel(`${OAuthStateService.PREFIX}${state}`);
    if (!raw) return null;
    return JSON.parse(raw) as OAuthStateData;
  }

  onModuleDestroy(): void {
    void this.redis.quit();
  }
}
