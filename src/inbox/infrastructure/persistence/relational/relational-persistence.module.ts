import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InboxMessageEntity } from './entities/inbox-message.entity';
import { InboxMessageMapper } from './mappers/inbox-message.mapper';
import { InboxMessagesRepository } from './repositories/inbox-messages.repository';

@Module({
  imports: [TypeOrmModule.forFeature([InboxMessageEntity])],
  providers: [InboxMessageMapper, InboxMessagesRepository],
  exports: [InboxMessagesRepository],
})
export class InboxRelationalPersistenceModule {}
