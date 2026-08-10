import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  InvitationSchema,
  InvitationSchemaClass,
} from './entities/invitation.schema';
import { InvitationRepository } from '../invitation.repository';
import { InvitationDocumentRepository } from './repositories/invitation.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InvitationSchemaClass.name, schema: InvitationSchema },
    ]),
  ],
  providers: [
    {
      provide: InvitationRepository,
      useClass: InvitationDocumentRepository,
    },
  ],
  exports: [InvitationRepository],
})
export class DocumentInvitationPersistenceModule {}
