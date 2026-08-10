import { Module } from '@nestjs/common';
import { InvitationRepository } from '../invitation.repository';
import { InvitationRelationalRepository } from './repositories/invitation.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationEntity } from './entities/invitation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InvitationEntity])],
  providers: [
    {
      provide: InvitationRepository,
      useClass: InvitationRelationalRepository,
    },
  ],
  exports: [InvitationRepository],
})
export class RelationalInvitationPersistenceModule {}
