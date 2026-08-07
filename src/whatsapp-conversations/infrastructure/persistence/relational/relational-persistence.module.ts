import { Module } from '@nestjs/common';
import { WhatsappConversationRepository } from '../whatsapp-conversation.repository';
import { WhatsappConversationRelationalRepository } from './repositories/whatsapp-conversation.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsappConversationEntity } from './entities/whatsapp-conversation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WhatsappConversationEntity])],
  providers: [
    {
      provide: WhatsappConversationRepository,
      useClass: WhatsappConversationRelationalRepository,
    },
  ],
  exports: [WhatsappConversationRepository],
})
export class RelationalWhatsappConversationPersistenceModule {}
