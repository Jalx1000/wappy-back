import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationMapper } from './mappers/notification.mapper';
import { NotificationsRepository } from './repositories/notifications.repository';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationEntity])],
  providers: [NotificationMapper, NotificationsRepository],
  exports: [NotificationsRepository],
})
export class NotificationsRelationalPersistenceModule {}
