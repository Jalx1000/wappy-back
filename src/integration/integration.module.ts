import { Module } from '@nestjs/common';
import { IntegrationContactsController } from './contacts/integration-contacts.controller';
import { IntegrationEmailsController } from './emails/integration-emails.controller';
import { IntegrationEmailsService } from './emails/integration-emails.service';
import { IntegrationWhatsappController } from './whatsapp/integration-whatsapp.controller';
import { IntegrationWhatsappService } from './whatsapp/integration-whatsapp.service';
import { IntegrationOrdersController } from './orders/integration-orders.controller';
import { ContactsModule } from '../contacts/contacts.module';
import { OrdersModule } from '../orders/orders.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { MailerModule } from '../mailer/mailer.module';
import { ConnectionsModule } from '../connections/connections.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { WhatsappSendService } from '../social-inbox/whatsapp-send.service';
import { IdempotencyService } from './idempotency/idempotency.service';

/**
 * Public server-to-server integration API (API-key auth). A thin facade over
 * existing domain services. F1: contacts. F2: transactional emails (SMTP).
 * F3: WhatsApp templates. F4: idempotency + rate limiting on the endpoints.
 * Orders: WooCommerce checkout → upsert contact + order with line items.
 */
@Module({
  imports: [
    ContactsModule,
    OrdersModule,
    ApiKeysModule,
    MailerModule,
    ConnectionsModule,
    EncryptionModule,
  ],
  controllers: [
    IntegrationContactsController,
    IntegrationEmailsController,
    IntegrationWhatsappController,
    IntegrationOrdersController,
  ],
  providers: [
    IntegrationEmailsService,
    IntegrationWhatsappService,
    WhatsappSendService,
    IdempotencyService,
  ],
})
export class IntegrationModule {}
