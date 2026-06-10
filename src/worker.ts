import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './workers/worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['log', 'error', 'warn'],
  });

  app.enableShutdownHooks();

  console.log('Fobo Metrics Worker started');
}

void bootstrap();
