import { Module } from '@nestjs/common';
import { IntegrationContactsController } from './contacts/integration-contacts.controller';
import { IntegrationEmailsController } from './emails/integration-emails.controller';
import { IntegrationEmailsService } from './emails/integration-emails.service';
import { ContactsModule } from '../contacts/contacts.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { MailerModule } from '../mailer/mailer.module';

/**
 * Public server-to-server integration API (API-key auth). A thin facade over
 * existing domain services. F1: contacts. F2: transactional emails (SMTP).
 */
@Module({
  imports: [ContactsModule, ApiKeysModule, MailerModule],
  controllers: [IntegrationContactsController, IntegrationEmailsController],
  providers: [IntegrationEmailsService],
})
export class IntegrationModule {}
