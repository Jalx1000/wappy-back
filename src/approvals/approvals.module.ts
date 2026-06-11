import { Module } from '@nestjs/common';
import { ApprovalsRelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';

@Module({
  imports: [ApprovalsRelationalPersistenceModule],
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
})
export class ApprovalsModule {}
