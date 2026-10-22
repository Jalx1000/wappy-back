import { Module } from '@nestjs/common';
import { WebhookEndpointRepository } from '../webhook-endpoint.repository';
import { WebhookEndpointRelationalRepository } from './repositories/webhook-endpoint.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookEndpointEntity } from './entities/webhook-endpoint.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WebhookEndpointEntity])],
  providers: [
    {
      provide: WebhookEndpointRepository,
      useClass: WebhookEndpointRelationalRepository,
    },
  ],
  exports: [WebhookEndpointRepository],
})
export class RelationalWebhookEndpointPersistenceModule {}
