import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstagramMessageRepository } from '../instagram-message.repository';
import { InstagramMessageRelationalRepository } from './repositories/instagram-message.repository';
import { InstagramMessageEntity } from './entities/instagram-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InstagramMessageEntity])],
  providers: [
    {
      provide: InstagramMessageRepository,
      useClass: InstagramMessageRelationalRepository,
    },
  ],
  exports: [InstagramMessageRepository],
})
export class RelationalInstagramMessagePersistenceModule {}
