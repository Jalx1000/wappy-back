import { Module } from '@nestjs/common';
import { CalendarRelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';

@Module({
  imports: [CalendarRelationalPersistenceModule],
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}
