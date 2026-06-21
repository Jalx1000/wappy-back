import { Module } from '@nestjs/common';
import { ConnectionsRelationalPersistenceModule } from '../connections/infrastructure/persistence/relational/relational-persistence.module';
import { TiktokWebhookController } from './tiktok-webhook.controller';
import { TiktokWebhookService } from './tiktok-webhook.service';

@Module({
  imports: [ConnectionsRelationalPersistenceModule],
  controllers: [TiktokWebhookController],
  providers: [TiktokWebhookService],
})
export class WebhooksModule {}
