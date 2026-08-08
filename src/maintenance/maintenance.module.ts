import { Module } from '@nestjs/common';
import { ConnectionsRelationalPersistenceModule } from '../connections/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalContactPersistenceModule } from '../contacts/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalInstagramConversationPersistenceModule } from '../instagram-conversations/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalMessengerConversationPersistenceModule } from '../messenger-conversations/infrastructure/persistence/relational/relational-persistence.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { MetaProfileService } from '../webhooks/meta-profile.service';
import { MetaProfileBackfillService } from '../database/backfill/meta-profile-backfill.service';
import { MaintenanceController } from './maintenance.controller';

// Exposes admin-only maintenance endpoints. Reuses the same backfill service the
// CLI script (`npm run backfill:meta-profiles`) uses, wired against the running
// app's repositories.
@Module({
  imports: [
    ConnectionsRelationalPersistenceModule,
    RelationalContactPersistenceModule,
    RelationalInstagramConversationPersistenceModule,
    RelationalMessengerConversationPersistenceModule,
    EncryptionModule,
  ],
  controllers: [MaintenanceController],
  providers: [MetaProfileService, MetaProfileBackfillService],
})
export class MaintenanceModule {}
