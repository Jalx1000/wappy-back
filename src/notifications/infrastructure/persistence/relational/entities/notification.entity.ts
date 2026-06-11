import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

@Entity('notification')
@Index(['userId'])
export class NotificationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'brand_id', nullable: true })
  brandId?: number;

  @Column()
  type: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ default: false })
  read: boolean;

  @Column({ type: 'jsonb', default: '{}' })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
