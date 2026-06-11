import { Module } from '@nestjs/common';
import { InboxRelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';

@Module({
  imports: [InboxRelationalPersistenceModule],
  controllers: [InboxController],
  providers: [InboxService],
  exports: [InboxService],
})
export class InboxModule {}
