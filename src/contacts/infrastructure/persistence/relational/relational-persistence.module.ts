import { Module } from '@nestjs/common';
import { ContactRepository } from '../contact.repository';
import { ContactRelationalRepository } from './repositories/contact.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactEntity } from './entities/contact.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ContactEntity])],
  providers: [
    {
      provide: ContactRepository,
      useClass: ContactRelationalRepository,
    },
  ],
  exports: [ContactRepository],
})
export class RelationalContactPersistenceModule {}
