import { Module } from '@nestjs/common';
import { BrandsModule } from '../brands/brands.module';
import { ConnectionsRelationalPersistenceModule } from '../connections/infrastructure/persistence/relational/relational-persistence.module';
import { ContactsModule } from '../contacts/contacts.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { RelationalWhatsappConversationPersistenceModule } from '../whatsapp-conversations/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalWhatsappMessagePersistenceModule } from '../whatsapp-messages/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalInstagramConversationPersistenceModule } from '../instagram-conversations/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalInstagramMessagePersistenceModule } from '../instagram-messages/infrastructure/persistence/relational/relational-persistence.module';
import { SocialInboxController } from './social-inbox.controller';
import { SocialInboxService } from './social-inbox.service';
import { WhatsappSendService } from './whatsapp-send.service';
import { WhatsappMediaService } from './whatsapp-media.service';
import { InstagramSendService } from './instagram-send.service';

@Module({
  imports: [
    BrandsModule,
    ConnectionsRelationalPersistenceModule,
    ContactsModule,
    EncryptionModule,
    RelationalWhatsappConversationPersistenceModule,
    RelationalWhatsappMessagePersistenceModule,
    RelationalInstagramConversationPersistenceModule,
    RelationalInstagramMessagePersistenceModule,
  ],
  controllers: [SocialInboxController],
  providers: [
    SocialInboxService,
    WhatsappSendService,
    WhatsappMediaService,
    InstagramSendService,
  ],
})
export class SocialInboxModule {}
