import { Module } from '@nestjs/common';
import { ConversationRatingRepository } from '../conversation-rating.repository';
import { ConversationRatingRelationalRepository } from './repositories/conversation-rating.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationRatingEntity } from './entities/conversation-rating.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConversationRatingEntity])],
  providers: [
    {
      provide: ConversationRatingRepository,
      useClass: ConversationRatingRelationalRepository,
    },
  ],
  exports: [ConversationRatingRepository],
})
export class RelationalConversationRatingPersistenceModule {}
