export class Notification {
  id: number;
  userId: number;
  brandId?: number;
  type: string;
  title: string;
  body: string;
  read: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}
