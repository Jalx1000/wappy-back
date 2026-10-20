import { Module } from '@nestjs/common';
import { ConversationStateRepository } from '../conversation-state.repository';
import { ConversationStateRelationalRepository } from './repositories/conversation-state.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationStateEntity } from './entities/conversation-state.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConversationStateEntity])],
  providers: [
    {
      provide: ConversationStateRepository,
      useClass: ConversationStateRelationalRepository,
    },
  ],
  exports: [ConversationStateRepository],
})
export class RelationalConversationStatePersistenceModule {}
