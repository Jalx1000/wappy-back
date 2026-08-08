import { NestFactory } from '@nestjs/core';
import { BackfillModule } from './backfill.module';
import { MetaProfileBackfillService } from './meta-profile-backfill.service';

const run = async () => {
  const app = await NestFactory.createApplicationContext(BackfillModule);
  await app.get(MetaProfileBackfillService).run();
  await app.close();
};

void run();
