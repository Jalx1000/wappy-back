import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandEntity } from './entities/brand.entity';
import { BrandMembershipEntity } from './entities/brand-membership.entity';
import { BrandSettingsEntity } from './entities/brand-settings.entity';
import { BrandsRepository } from './repositories/brands.repository';
import { BrandMembershipsRepository } from './repositories/brand-memberships.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BrandEntity,
      BrandMembershipEntity,
      BrandSettingsEntity,
    ]),
  ],
  providers: [BrandsRepository, BrandMembershipsRepository],
  exports: [BrandsRepository, BrandMembershipsRepository],
})
export class BrandsRelationalPersistenceModule {}
