import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { ConversationAssignmentsService } from './conversation-assignments.service';
import { ConversationAssignmentsController } from './conversation-assignments.controller';
import { RelationalConversationAssignmentPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import databaseConfig from '../database/config/database.config';
import { DatabaseConfig } from '../database/config/database-config.type';
import { DocumentConversationAssignmentPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';

const infrastructurePersistenceModule = (databaseConfig() as DatabaseConfig)
  .isDocumentDatabase
  ? DocumentConversationAssignmentPersistenceModule
  : RelationalConversationAssignmentPersistenceModule;

@Module({
  imports: [
    // do not remove this comment
    infrastructurePersistenceModule,
  ],
  controllers: [ConversationAssignmentsController],
  providers: [ConversationAssignmentsService],
  exports: [ConversationAssignmentsService, infrastructurePersistenceModule],
})
export class ConversationAssignmentsModule {}
