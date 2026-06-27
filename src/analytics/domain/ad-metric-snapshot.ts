export class AdMetricSnapshot {
  id: number;
  campaignId: number;
  brandId: number;
  date: Date;
  spend: number;
  impressions: number;
  reach: number;
  frequency?: number;
  clicks: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  conversions: number;
  roas?: number;
  createdAt: Date;
}
