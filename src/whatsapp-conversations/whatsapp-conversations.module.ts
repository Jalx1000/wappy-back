import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { WhatsappConversationsService } from './whatsapp-conversations.service';
import { WhatsappConversationsController } from './whatsapp-conversations.controller';
import { RelationalWhatsappConversationPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    // do not remove this comment
    RelationalWhatsappConversationPersistenceModule,
  ],
  controllers: [WhatsappConversationsController],
  providers: [WhatsappConversationsService],
  exports: [
    WhatsappConversationsService,
    RelationalWhatsappConversationPersistenceModule,
  ],
})
export class WhatsappConversationsModule {}
