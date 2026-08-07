import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity('inbox_message')
@Index(['brandId'])
@Index(['externalId'], { unique: true })
export class InboxMessageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'brand_id' })
  brandId: number;

  @Column({ name: 'connection_id' })
  connectionId: number;

  @Column()
  channel: string;

  @Column({ name: 'external_id', unique: true })
  externalId: string;

  @Column()
  type: string;

  @Column({ name: 'from_handle' })
  fromHandle: string;

  @Column({ name: 'from_name', nullable: true })
  fromName?: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'media_url', nullable: true })
  mediaUrl?: string;

  @Column({ name: 'parent_external_id', nullable: true })
  parentExternalId?: string;

  @Column({ default: 'new' })
  status: string;

  @Column({ name: 'published_at', nullable: true })
  publishedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;
}
