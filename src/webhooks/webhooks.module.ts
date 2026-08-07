import { Module } from '@nestjs/common';
import { ConnectionsRelationalPersistenceModule } from '../connections/infrastructure/persistence/relational/relational-persistence.module';
import { ContactsModule } from '../contacts/contacts.module';
import { RelationalWhatsappConversationPersistenceModule } from '../whatsapp-conversations/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalWhatsappMessagePersistenceModule } from '../whatsapp-messages/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalInstagramConversationPersistenceModule } from '../instagram-conversations/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalInstagramMessagePersistenceModule } from '../instagram-messages/infrastructure/persistence/relational/relational-persistence.module';
import { QueueModule } from '../queues/queue.module';
import { TiktokWebhookController } from './tiktok-webhook.controller';
import { TiktokWebhookService } from './tiktok-webhook.service';
import { WhatsappWebhookController } from './whatsapp-webhook.controller';
import { WhatsappWebhookService } from './whatsapp-webhook.service';
import { WhatsappIngestService } from './whatsapp-ingest.service';
import { InstagramWebhookController } from './instagram-webhook.controller';
import { InstagramWebhookService } from './instagram-webhook.service';
import { InstagramIngestService } from './instagram-ingest.service';

@Module({
  imports: [
    ConnectionsRelationalPersistenceModule,
    ContactsModule,
    RelationalWhatsappConversationPersistenceModule,
    RelationalWhatsappMessagePersistenceModule,
    RelationalInstagramConversationPersistenceModule,
    RelationalInstagramMessagePersistenceModule,
    QueueModule,
  ],
  controllers: [
    TiktokWebhookController,
    WhatsappWebhookController,
    InstagramWebhookController,
  ],
  providers: [
    TiktokWebhookService,
    WhatsappWebhookService,
    WhatsappIngestService,
    InstagramWebhookService,
    InstagramIngestService,
  ],
})
export class WebhooksModule {}
