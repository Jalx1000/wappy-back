import { Module } from '@nestjs/common';
import { WhatsappSyncRequestRepository } from '../whatsapp-sync-request.repository';
import { WhatsappSyncRequestRelationalRepository } from './repositories/whatsapp-sync-request.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsappSyncRequestEntity } from './entities/whatsapp-sync-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WhatsappSyncRequestEntity])],
  providers: [
    {
      provide: WhatsappSyncRequestRepository,
      useClass: WhatsappSyncRequestRelationalRepository,
    },
  ],
  exports: [WhatsappSyncRequestRepository],
})
export class RelationalWhatsappSyncRequestPersistenceModule {}
