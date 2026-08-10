import { Module } from '@nestjs/common';
import { ConversationAssignmentRepository } from '../conversation-assignment.repository';
import { ConversationAssignmentRelationalRepository } from './repositories/conversation-assignment.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationAssignmentEntity } from './entities/conversation-assignment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConversationAssignmentEntity])],
  providers: [
    {
      provide: ConversationAssignmentRepository,
      useClass: ConversationAssignmentRelationalRepository,
    },
  ],
  exports: [ConversationAssignmentRepository],
})
export class RelationalConversationAssignmentPersistenceModule {}
