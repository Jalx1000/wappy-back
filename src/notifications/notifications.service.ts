import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from './infrastructure/persistence/relational/repositories/notifications.repository';
import { Notification } from './domain/notification';

export interface CreateNotificationPayload {
  userId: number;
  brandId?: number;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly notificationsRepo: NotificationsRepository) {}

  async getByUser(userId: number, limit: number = 20): Promise<Notification[]> {
    return this.notificationsRepo.findByUser(userId, false, limit);
  }

  async getUnread(userId: number, limit: number = 20): Promise<Notification[]> {
    return this.notificationsRepo.findByUser(userId, true, limit);
  }

  async create(payload: CreateNotificationPayload): Promise<Notification> {
    const notification = new Notification();
    notification.userId = payload.userId;
    notification.brandId = payload.brandId;
    notification.type = payload.type;
    notification.title = payload.title;
    notification.body = payload.body;
    notification.read = false;
    notification.metadata = payload.metadata;
    return this.notificationsRepo.save(notification);
  }

  async markAsRead(id: number): Promise<void> {
    await this.notificationsRepo.markAsRead(id);
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationsRepo.markAllAsRead(userId);
  }
}
