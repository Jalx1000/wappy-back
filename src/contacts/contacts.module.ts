import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { RelationalContactPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { RelationalContactIdentityPersistenceModule } from '../contact-identities/infrastructure/persistence/relational/relational-persistence.module';
import { BrandsModule } from '../brands/brands.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    // do not remove this comment
    RelationalContactPersistenceModule,
    RelationalContactIdentityPersistenceModule,
    BrandsModule,
    OrdersModule,
  ],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService, RelationalContactPersistenceModule],
})
export class ContactsModule {}
