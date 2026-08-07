import { Module } from '@nestjs/common';
import { ContactIdentityRepository } from '../contact-identity.repository';
import { ContactIdentityRelationalRepository } from './repositories/contact-identity.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactIdentityEntity } from './entities/contact-identity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ContactIdentityEntity])],
  providers: [
    {
      provide: ContactIdentityRepository,
      useClass: ContactIdentityRelationalRepository,
    },
  ],
  exports: [ContactIdentityRepository],
})
export class RelationalContactIdentityPersistenceModule {}
