export class Asset {
  id: number;
  brandId: number;
  name: string;
  type: string;
  mimeType: string;
  fileId?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  uploadedByUserId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
