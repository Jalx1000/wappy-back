import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalEntity } from './entities/approval.entity';
import { ApprovalMapper } from './mappers/approval.mapper';
import { ApprovalsRepository } from './repositories/approvals.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ApprovalEntity])],
  providers: [ApprovalMapper, ApprovalsRepository],
  exports: [ApprovalsRepository],
})
export class ApprovalsRelationalPersistenceModule {}
