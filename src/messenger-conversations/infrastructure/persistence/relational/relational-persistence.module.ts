import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessengerConversationRepository } from '../messenger-conversation.repository';
import { MessengerConversationRelationalRepository } from './repositories/messenger-conversation.repository';
import { MessengerConversationEntity } from './entities/messenger-conversation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MessengerConversationEntity])],
  providers: [
    {
      provide: MessengerConversationRepository,
      useClass: MessengerConversationRelationalRepository,
    },
  ],
  exports: [MessengerConversationRepository],
})
export class RelationalMessengerConversationPersistenceModule {}
