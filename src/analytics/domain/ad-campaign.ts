export class AdCampaign {
  id: number;
  brandId: number;
  connectionId: number;
  externalId: string;
  name: string;
  status: string;
  objective?: string;
  budget?: number;
  currency?: string;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
