import { Module } from '@nestjs/common';
import { ConnectionsController } from './connections.controller';
import { StrandedConnectionsController } from './stranded-connections.controller';
import { WhatsappCloudController } from './whatsapp-cloud.controller';
import { ConnectionsService } from './connections.service';
import { WhatsappCloudService } from './whatsapp-cloud.service';
import { ConnectionsRelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { BrandsModule } from '../brands/brands.module';
import { QueueModule } from '../queues/queue.module';

@Module({
  imports: [
    ConnectionsRelationalPersistenceModule,
    EncryptionModule,
    BrandsModule,
    QueueModule,
  ],
  controllers: [
    ConnectionsController,
    StrandedConnectionsController,
    WhatsappCloudController,
  ],
  providers: [ConnectionsService, WhatsappCloudService],
  exports: [ConnectionsService, ConnectionsRelationalPersistenceModule],
})
export class ConnectionsModule {}
