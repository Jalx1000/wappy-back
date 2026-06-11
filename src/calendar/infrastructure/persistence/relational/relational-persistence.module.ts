import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarItemEntity } from './entities/calendar-item.entity';
import { CalendarItemMapper } from './mappers/calendar-item.mapper';
import { CalendarItemsRepository } from './repositories/calendar-items.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CalendarItemEntity])],
  providers: [CalendarItemMapper, CalendarItemsRepository],
  exports: [CalendarItemsRepository],
})
export class CalendarRelationalPersistenceModule {}
