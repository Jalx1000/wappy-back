import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { WhatsappSyncRequestsService } from './whatsapp-sync-requests.service';
import { WhatsappSyncRequestsController } from './whatsapp-sync-requests.controller';
import { RelationalWhatsappSyncRequestPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    // do not remove this comment
    RelationalWhatsappSyncRequestPersistenceModule,
  ],
  controllers: [WhatsappSyncRequestsController],
  providers: [WhatsappSyncRequestsService],
  exports: [
    WhatsappSyncRequestsService,
    RelationalWhatsappSyncRequestPersistenceModule,
  ],
})
export class WhatsappSyncRequestsModule {}
