import { Module } from '@nestjs/common';
import { OrphanAccountsRelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { OrphanAccountsController } from './orphan-accounts.controller';
import { OrphanAccountsService } from './orphan-accounts.service';
import { ConnectionsModule } from '../connections.module';
import { EncryptionModule } from '../../encryption/encryption.module';

@Module({
  imports: [
    OrphanAccountsRelationalPersistenceModule,
    ConnectionsModule,
    EncryptionModule,
  ],
  controllers: [OrphanAccountsController],
  providers: [OrphanAccountsService],
  exports: [OrphanAccountsService, OrphanAccountsRelationalPersistenceModule],
})
export class OrphanAccountsModule {}
