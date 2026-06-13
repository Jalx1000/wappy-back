import { WebDimensionEnum } from './web-dimension.enum';

export class WebDimensionSnapshot {
  id: number;
  brandId: number;
  connectionId: number;
  date: Date;
  dimension: WebDimensionEnum;
  dimensionValue: string;
  sessions: number;
  users: number;
  conversions: number;
  createdAt: Date;
  updatedAt: Date;
}
