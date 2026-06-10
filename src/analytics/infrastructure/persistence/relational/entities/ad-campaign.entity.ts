import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('ad_campaign')
@Index(['brandId'])
@Index(['externalId'])
export class AdCampaignEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'brand_id' })
  brandId: number;

  @Column({ name: 'connection_id' })
  connectionId: number;

  @Column()
  externalId: string;

  @Column()
  name: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ nullable: true })
  objective?: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  budget?: number;

  @Column({ nullable: true, default: 'USD' })
  currency?: string;

  @Column({ type: 'date', nullable: true })
  startDate?: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
