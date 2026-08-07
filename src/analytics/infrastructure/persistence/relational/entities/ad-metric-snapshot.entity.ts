import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity('ad_metric_snapshot')
@Index(['campaignId', 'date'], { unique: true })
@Index(['brandId', 'date'])
export class AdMetricSnapshotEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'campaign_id' })
  campaignId: number;

  @Column({ name: 'brand_id' })
  brandId: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'decimal', precision: 18, scale: 4, default: 0 })
  spend: number;

  @Column({ default: 0 })
  impressions: number;

  // Unique accounts reached (per day, per campaign). Meta/TikTok report it
  // natively; summing dailies over a range approximates period reach.
  @Column({ default: 0 })
  reach: number;

  // Avg impressions per reached user for the row (impressions / reach).
  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  frequency?: number;

  @Column({ default: 0 })
  clicks: number;

  @Column({ type: 'decimal', precision: 8, scale: 6, nullable: true })
  ctr?: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  cpc?: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  cpm?: number;

  @Column({ default: 0 })
  conversions: number;

  @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  roas?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
