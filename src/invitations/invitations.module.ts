import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { RelationalInvitationPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import databaseConfig from '../database/config/database.config';
import { DatabaseConfig } from '../database/config/database-config.type';
import { DocumentInvitationPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';
import { BrandsRelationalPersistenceModule } from '../brands/infrastructure/persistence/relational/relational-persistence.module';
import { MailModule } from '../mail/mail.module';

const infrastructurePersistenceModule = (databaseConfig() as DatabaseConfig)
  .isDocumentDatabase
  ? DocumentInvitationPersistenceModule
  : RelationalInvitationPersistenceModule;

@Module({
  imports: [
    // do not remove this comment
    infrastructurePersistenceModule,
    BrandsRelationalPersistenceModule,
    MailModule,
  ],
  controllers: [InvitationsController],
  providers: [InvitationsService],
  exports: [InvitationsService, infrastructurePersistenceModule],
})
export class InvitationsModule {}
