import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { WhatsappMessagesService } from './whatsapp-messages.service';
import { WhatsappMessagesController } from './whatsapp-messages.controller';
import { RelationalWhatsappMessagePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    // do not remove this comment
    RelationalWhatsappMessagePersistenceModule,
  ],
  controllers: [WhatsappMessagesController],
  providers: [WhatsappMessagesService],
  exports: [
    WhatsappMessagesService,
    RelationalWhatsappMessagePersistenceModule,
  ],
})
export class WhatsappMessagesModule {}
