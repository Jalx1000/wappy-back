export interface Annotation {
  x: number;
  y: number;
  width: number;
  height: number;
  comment: string;
  userId: number;
}

export class Approval {
  id: number;
  brandId: number;
  assetId: number;
  calendarItemId?: number;
  requestedByUserId: number;
  reviewedByUserId?: number;
  status: string;
  feedback?: string;
  annotations?: Annotation[];
  createdAt: Date;
  updatedAt: Date;
}
