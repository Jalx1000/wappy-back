import { Module } from '@nestjs/common';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';
import { BrandsRelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [BrandsRelationalPersistenceModule],
  controllers: [BrandsController],
  providers: [BrandsService],
  exports: [BrandsService, BrandsRelationalPersistenceModule],
})
export class BrandsModule {}
