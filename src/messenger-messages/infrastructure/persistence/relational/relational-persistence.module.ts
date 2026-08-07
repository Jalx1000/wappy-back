import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessengerMessageRepository } from '../messenger-message.repository';
import { MessengerMessageRelationalRepository } from './repositories/messenger-message.repository';
import { MessengerMessageEntity } from './entities/messenger-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MessengerMessageEntity])],
  providers: [
    {
      provide: MessengerMessageRepository,
      useClass: MessengerMessageRelationalRepository,
    },
  ],
  exports: [MessengerMessageRepository],
})
export class RelationalMessengerMessagePersistenceModule {}
