import { Module } from '@nestjs/common';
import { AssetsRelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';

@Module({
  imports: [AssetsRelationalPersistenceModule],
  controllers: [AssetsController],
  providers: [AssetsService],
})
export class AssetsModule {}
