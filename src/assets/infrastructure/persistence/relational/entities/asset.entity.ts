import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('asset')
@Index(['brandId'])
@Index(['type'])
export class AssetEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'brand_id' })
  brandId: number;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column({ name: 'file_id', nullable: true })
  fileId?: string;

  @Column({ type: 'jsonb', default: '[]' })
  tags?: string[];

  @Column({ type: 'jsonb', default: '{}' })
  metadata?: Record<string, any>;

  @Column({ name: 'uploaded_by_user_id' })
  uploadedByUserId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
