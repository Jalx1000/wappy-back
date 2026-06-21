import { Module } from '@nestjs/common';
import { ApprovalsRelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';
import { BrandsModule } from '../brands/brands.module';
import { CalendarRelationalPersistenceModule } from '../calendar/infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    ApprovalsRelationalPersistenceModule,
    BrandsModule,
    CalendarRelationalPersistenceModule,
  ],
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
})
export class ApprovalsModule {}
