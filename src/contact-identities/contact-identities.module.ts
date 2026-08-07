import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { ContactIdentitiesService } from './contact-identities.service';
import { ContactIdentitiesController } from './contact-identities.controller';
import { RelationalContactIdentityPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    // do not remove this comment
    RelationalContactIdentityPersistenceModule,
  ],
  controllers: [ContactIdentitiesController],
  providers: [ContactIdentitiesService],
  exports: [
    ContactIdentitiesService,
    RelationalContactIdentityPersistenceModule,
  ],
})
export class ContactIdentitiesModule {}
