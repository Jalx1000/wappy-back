import { Module } from '@nestjs/common';
import { CalendarRelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { BrandsModule } from '../brands/brands.module';

@Module({
  imports: [CalendarRelationalPersistenceModule, BrandsModule],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
