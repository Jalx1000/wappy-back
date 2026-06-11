export class CalendarItem {
  id: number;
  brandId: number;
  connectionId?: number;
  title: string;
  description?: string;
  scheduledAt: Date;
  status: string;
  type?: string;
  mediaUrls?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
