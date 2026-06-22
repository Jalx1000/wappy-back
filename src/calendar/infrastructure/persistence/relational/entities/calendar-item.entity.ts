import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('calendar_item')
@Index(['brandId'])
@Index(['scheduledAt'])
export class CalendarItemEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'brand_id' })
  brandId: number;

  @Column({ name: 'connection_id', nullable: true })
  connectionId?: number;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ name: 'scheduled_at' })
  scheduledAt: Date;

  @Column({ default: 'draft' })
  status: string;

  @Column({ nullable: true })
  type?: string;

  @Column({ name: 'media_urls', type: 'jsonb', default: '[]' })
  mediaUrls?: string[];

  @Column({ type: 'jsonb', default: '{}' })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
