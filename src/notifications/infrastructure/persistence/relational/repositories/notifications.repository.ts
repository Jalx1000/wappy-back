import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from '../entities/notification.entity';
import { Notification } from '../../../../domain/notification';
import { NotificationMapper } from '../mappers/notification.mapper';

@Injectable()
export class NotificationsRepository {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repo: Repository<NotificationEntity>,
    private readonly mapper: NotificationMapper,
  ) {}

  async findByUser(
    userId: number,
    unreadOnly: boolean = false,
    limit: number = 20,
  ): Promise<Notification[]> {
    const query = this.repo
      .createQueryBuilder('n')
      .where('n.userId = :userId', { userId });

    if (unreadOnly) {
      query.andWhere('n.read = false');
    }

    const entities = await query
      .orderBy('n.createdAt', 'DESC')
      .take(limit)
      .getMany();

    return entities.map((e) => this.mapper.toDomain(e));
  }

  async save(domain: Notification): Promise<Notification> {
    const entity = this.mapper.toEntity(domain);
    const saved = await this.repo.save(entity);
    return this.mapper.toDomain(saved);
  }

  async markAsRead(id: number): Promise<void> {
    await this.repo.update(id, { read: true });
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.repo.update({ userId, read: false }, { read: true });
  }
}
