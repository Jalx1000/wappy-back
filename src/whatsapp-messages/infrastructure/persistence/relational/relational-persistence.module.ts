import { Module } from '@nestjs/common';
import { WhatsappMessageRepository } from '../whatsapp-message.repository';
import { WhatsappMessageRelationalRepository } from './repositories/whatsapp-message.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsappMessageEntity } from './entities/whatsapp-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WhatsappMessageEntity])],
  providers: [
    {
      provide: WhatsappMessageRepository,
      useClass: WhatsappMessageRelationalRepository,
    },
  ],
  exports: [WhatsappMessageRepository],
})
export class RelationalWhatsappMessagePersistenceModule {}
