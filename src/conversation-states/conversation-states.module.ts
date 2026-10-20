import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { ConversationStatesService } from './conversation-states.service';
import { RelationalConversationStatePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    // do not remove this comment
    RelationalConversationStatePersistenceModule,
  ],
  // Generic CRUD controller intentionally not registered: writes are brand-scoped
  // via social-inbox (status endpoint + ingest/send stamping), not an open CRUD.
  controllers: [],
  providers: [ConversationStatesService],
  exports: [
    ConversationStatesService,
    RelationalConversationStatePersistenceModule,
  ],
})
export class ConversationStatesModule {}
