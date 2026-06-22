import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Annotation } from '../../../../domain/approval';

@Entity('approval')
@Index(['brandId'])
@Index(['status'])
export class ApprovalEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'brand_id' })
  brandId: number;

  @Column({ name: 'asset_id' })
  assetId: number;

  @Column({ name: 'calendar_item_id', nullable: true })
  calendarItemId?: number;

  @Column({ name: 'requested_by_user_id' })
  requestedByUserId: number;

  @Column({ name: 'reviewed_by_user_id', nullable: true })
  reviewedByUserId?: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true, type: 'text' })
  feedback?: string;

  @Column({ type: 'jsonb', default: '[]' })
  annotations?: Annotation[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
