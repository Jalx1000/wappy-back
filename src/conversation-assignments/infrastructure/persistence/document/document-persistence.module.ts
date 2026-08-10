import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ConversationAssignmentSchema,
  ConversationAssignmentSchemaClass,
} from './entities/conversation-assignment.schema';
import { ConversationAssignmentRepository } from '../conversation-assignment.repository';
import { ConversationAssignmentDocumentRepository } from './repositories/conversation-assignment.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ConversationAssignmentSchemaClass.name,
        schema: ConversationAssignmentSchema,
      },
    ]),
  ],
  providers: [
    {
      provide: ConversationAssignmentRepository,
      useClass: ConversationAssignmentDocumentRepository,
    },
  ],
  exports: [ConversationAssignmentRepository],
})
export class DocumentConversationAssignmentPersistenceModule {}
