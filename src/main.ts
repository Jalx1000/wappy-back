import 'dotenv/config';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import helmet from 'helmet';
import { AppModule } from './app.module';
import validationOptions from './utils/validation-options';
import { AllConfigType } from './config/config.type';
import { ResolvePromisesInterceptor } from './utils/serializer.interceptor';
import { RedisIoAdapter } from './realtime/redis-io.adapter';

async function bootstrap() {
  // rawBody: true exposes req.rawBody (Buffer) so webhook controllers can verify
  // provider signatures (e.g. WhatsApp X-Hub-Signature-256) over the exact bytes
  // received — JSON.stringify of the parsed body would not match the HMAC.
  const app = await NestFactory.create(AppModule, {
    cors: true,
    rawBody: true,
  });
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const configService = app.get(ConfigService<AllConfigType>);

  // CORP same-origin (default de helmet) hace que el navegador bloquee las
  // imágenes de /files/* embebidas desde el frontend (otro dominio), aunque el
  // request devuelva 200. El API sirve assets para otros orígenes por diseño
  // (CORS ya es abierto), así que se relaja solo esa política.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  // TODO: BullBoardMiddleware no está registrado como provider — comentado para
  // que el arranque no falle. Reactivar cuando se agregue a app.module providers.
  // app.use('/admin/queues', app.get(BullBoardMiddleware));
  app.enableShutdownHooks();
  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: ['/'],
    },
  );
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalInterceptors(
    // ResolvePromisesInterceptor is used to resolve promises in responses because class-transformer can't do it
    // https://github.com/typestack/class-transformer/issues/549
    new ResolvePromisesInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  const options = new DocumentBuilder()
    .setTitle('Fobo Metrics API')
    .setDescription('API de reporting y operaciones de marketing — Fobo Agency')
    .setVersion('1.0')
    .addBearerAuth()
    .addGlobalParameters({
      in: 'header',
      required: false,
      name: process.env.APP_HEADER_LANGUAGE || 'x-custom-lang',
      schema: {
        example: 'en',
      },
    })
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  // Realtime (/rt): scale socket.io across instances with a Redis adapter when a
  // Redis URL is configured. Best-effort — falls back to the in-memory adapter.
  const redisUrl =
    process.env.WORKER_HOST || process.env.REDIS_URL || process.env.REDIS_HOST;
  if (redisUrl) {
    try {
      const redisIoAdapter = new RedisIoAdapter(app);
      await redisIoAdapter.connectToRedis(
        redisUrl.startsWith('redis') ? redisUrl : `redis://${redisUrl}`,
      );
      app.useWebSocketAdapter(redisIoAdapter);
    } catch {
      // keep the default in-memory adapter (single-instance / local dev)
    }
  }

  await app.listen(configService.getOrThrow('app.port', { infer: true }));
}
void bootstrap();
