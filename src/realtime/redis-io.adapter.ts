import { INestApplicationContext, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import type { Server, ServerOptions } from 'socket.io';

/**
 * socket.io adapter backed by Redis pub/sub so events fan out across every API
 * instance behind the load balancer (the app is stateless — a socket may live on
 * one instance while the message that must reach it is persisted on another).
 *
 * Best-effort: if Redis is unreachable the app still boots and falls back to the
 * default in-memory adapter (fine for a single instance / local dev).
 */
export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor?: ReturnType<typeof createAdapter>;

  constructor(app: INestApplicationContext) {
    super(app);
  }

  async connectToRedis(url: string): Promise<void> {
    // lazyConnect so we can await the initial connection here and let the caller
    // fall back to the in-memory adapter if Redis is unreachable (rather than the
    // clients silently retrying forever). Reconnection afterwards is automatic.
    const pubClient = new Redis(url, { lazyConnect: true });
    const subClient = pubClient.duplicate();
    pubClient.on('error', (e) =>
      this.logger.warn(`redis pub error: ${e.message}`),
    );
    subClient.on('error', (e) =>
      this.logger.warn(`redis sub error: ${e.message}`),
    );
    await Promise.all([pubClient.connect(), subClient.connect()]);
    this.adapterConstructor = createAdapter(pubClient, subClient);
    this.logger.log('socket.io Redis adapter enabled');
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, options) as Server;
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}
