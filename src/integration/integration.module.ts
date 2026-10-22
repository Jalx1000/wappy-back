import { Module } from '@nestjs/common';
import { IntegrationContactsController } from './contacts/integration-contacts.controller';
import { ContactsModule } from '../contacts/contacts.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';

/**
 * Public server-to-server integration API (API-key auth). A thin facade over
 * existing domain services (contacts, and later emails/whatsapp). F1: contacts.
 */
@Module({
  imports: [ContactsModule, ApiKeysModule],
  controllers: [IntegrationContactsController],
})
export class IntegrationModule {}
