export class InboxMessage {
  id: number;
  brandId: number;
  connectionId: number;
  channel: string;
  externalId: string;
  type: string;
  fromHandle: string;
  fromName?: string;
  content: string;
  mediaUrl?: string;
  parentExternalId?: string;
  status: string;
  publishedAt?: Date;
  createdAt: Date;
}
