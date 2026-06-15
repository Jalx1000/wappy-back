import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OAuthDiscoveryEntity } from './entities/oauth-discovery.entity';
import { OAuthDiscoveryMapper } from './mappers/oauth-discovery.mapper';
import { OAuthDiscoveriesRepository } from './repositories/oauth-discoveries.repository';

@Module({
  imports: [TypeOrmModule.forFeature([OAuthDiscoveryEntity])],
  providers: [OAuthDiscoveryMapper, OAuthDiscoveriesRepository],
  exports: [OAuthDiscoveriesRepository],
})
export class OAuthDiscoveriesRelationalPersistenceModule {}
