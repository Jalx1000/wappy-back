import { Module } from '@nestjs/common';
import { AssetsRelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { BrandsModule } from '../brands/brands.module';

@Module({
  imports: [AssetsRelationalPersistenceModule, BrandsModule],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
