import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { ConversationRatingsService } from './conversation-ratings.service';
import { RelationalConversationRatingPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    // do not remove this comment
    RelationalConversationRatingPersistenceModule,
  ],
  // Generic CRUD controller intentionally not registered: ingestion is
  // brand-scoped via POST /social-inbox/conversations/:id/rating, and CSAT is
  // read through the brand-scoped /social-inbox/metrics endpoint.
  controllers: [],
  providers: [ConversationRatingsService],
  exports: [
    ConversationRatingsService,
    RelationalConversationRatingPersistenceModule,
  ],
})
export class ConversationRatingsModule {}
