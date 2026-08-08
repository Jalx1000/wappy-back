import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { BrandsModule } from '../brands/brands.module';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeService } from './realtime.service';

/**
 * Global so `RealtimeService` can be injected (with `@Optional()`) by any domain
 * service that needs to push events — without those modules importing this one.
 * Only registered in the API root module, never in the worker: the worker has no
 * socket server, and `@Optional()` makes the missing provider a no-op there.
 */
@Global()
@Module({
  imports: [ConfigModule, JwtModule.register({}), BrandsModule],
  providers: [RealtimeGateway, RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
