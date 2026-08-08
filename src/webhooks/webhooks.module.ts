import { Module } from '@nestjs/common';
import { ConnectionsRelationalPersistenceModule } from '../connections/infrastructure/persistence/relational/relational-persistence.module';
import { ContactsModule } from '../contacts/contacts.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { RelationalWhatsappConversationPersistenceModule } from '../whatsapp-conversations/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalWhatsappMessagePersistenceModule } from '../whatsapp-messages/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalInstagramConversationPersistenceModule } from '../instagram-conversations/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalInstagramMessagePersistenceModule } from '../instagram-messages/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalMessengerConversationPersistenceModule } from '../messenger-conversations/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalMessengerMessagePersistenceModule } from '../messenger-messages/infrastructure/persistence/relational/relational-persistence.module';
import { QueueModule } from '../queues/queue.module';
import { TiktokWebhookController } from './tiktok-webhook.controller';
import { TiktokWebhookService } from './tiktok-webhook.service';
import { WhatsappWebhookController } from './whatsapp-webhook.controller';
import { WhatsappWebhookService } from './whatsapp-webhook.service';
import { WhatsappIngestService } from './whatsapp-ingest.service';
import { InstagramWebhookController } from './instagram-webhook.controller';
import { InstagramWebhookService } from './instagram-webhook.service';
import { InstagramIngestService } from './instagram-ingest.service';
import { MessengerWebhookController } from './messenger-webhook.controller';
import { MessengerWebhookService } from './messenger-webhook.service';
import { MessengerIngestService } from './messenger-ingest.service';
import { MetaProfileService } from './meta-profile.service';

@Module({
  imports: [
    ConnectionsRelationalPersistenceModule,
    ContactsModule,
    RelationalWhatsappConversationPersistenceModule,
    RelationalWhatsappMessagePersistenceModule,
    RelationalInstagramConversationPersistenceModule,
    RelationalInstagramMessagePersistenceModule,
    RelationalMessengerConversationPersistenceModule,
    RelationalMessengerMessagePersistenceModule,
    EncryptionModule,
    QueueModule,
  ],
  controllers: [
    TiktokWebhookController,
    WhatsappWebhookController,
    InstagramWebhookController,
    MessengerWebhookController,
  ],
  providers: [
    TiktokWebhookService,
    WhatsappWebhookService,
    WhatsappIngestService,
    InstagramWebhookService,
    InstagramIngestService,
    MessengerWebhookService,
    MessengerIngestService,
    MetaProfileService,
  ],
})
export class WebhooksModule {}
