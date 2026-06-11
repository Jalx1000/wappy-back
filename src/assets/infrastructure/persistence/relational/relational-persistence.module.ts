import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity } from './entities/asset.entity';
import { AssetMapper } from './mappers/asset.mapper';
import { AssetsRepository } from './repositories/assets.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AssetEntity])],
  providers: [AssetMapper, AssetsRepository],
  exports: [AssetsRepository],
})
export class AssetsRelationalPersistenceModule {}
