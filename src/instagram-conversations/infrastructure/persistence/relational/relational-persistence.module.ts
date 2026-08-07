import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstagramConversationRepository } from '../instagram-conversation.repository';
import { InstagramConversationRelationalRepository } from './repositories/instagram-conversation.repository';
import { InstagramConversationEntity } from './entities/instagram-conversation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InstagramConversationEntity])],
  providers: [
    {
      provide: InstagramConversationRepository,
      useClass: InstagramConversationRelationalRepository,
    },
  ],
  exports: [InstagramConversationRepository],
})
export class RelationalInstagramConversationPersistenceModule {}
