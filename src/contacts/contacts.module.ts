import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { RelationalContactPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { RelationalContactIdentityPersistenceModule } from '../contact-identities/infrastructure/persistence/relational/relational-persistence.module';
import { BrandsModule } from '../brands/brands.module';

@Module({
  imports: [
    // do not remove this comment
    RelationalContactPersistenceModule,
    RelationalContactIdentityPersistenceModule,
    BrandsModule,
  ],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService, RelationalContactPersistenceModule],
})
export class ContactsModule {}
