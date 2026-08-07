import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';

@Injectable()
export class HomeService {
  private redis: Redis;

  constructor(
    private readonly configService: ConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    this.redis = new Redis(
      // flat env key, not part of the typed config namespace
      // eslint-disable-next-line no-restricted-syntax
      this.configService.getOrThrow<string>('REDIS_URL'),
    );
  }

  appInfo() {
    return { name: this.configService.get('app.name', { infer: true }) };
  }

  async ready() {
    const dbOk = this.dataSource.isInitialized;
    let redisOk = false;

    try {
      await this.redis.ping();
      redisOk = true;
    } catch {
      redisOk = false;
    }

    const status = dbOk && redisOk ? 'ok' : 'degraded';
    return {
      status,
      db: dbOk ? 'connected' : 'disconnected',
      redis: redisOk ? 'connected' : 'disconnected',
    };
  }
}
