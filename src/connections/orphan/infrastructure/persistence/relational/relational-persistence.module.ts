import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrphanAccountEntity } from './entities/orphan-account.entity';
import { OrphanAccountMapper } from './mappers/orphan-account.mapper';
import { OrphanAccountsRepository } from './repositories/orphan-accounts.repository';

@Module({
  imports: [TypeOrmModule.forFeature([OrphanAccountEntity])],
  providers: [OrphanAccountMapper, OrphanAccountsRepository],
  exports: [OrphanAccountsRepository],
})
export class OrphanAccountsRelationalPersistenceModule {}
