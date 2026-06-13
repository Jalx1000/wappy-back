import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WebDimensionEnum } from '../../../../domain/web-dimension.enum';

@Entity('web_dimension_snapshot')
@Index(['connectionId', 'date', 'dimension', 'dimensionValue'], { unique: true })
@Index(['brandId', 'date', 'dimension'])
export class WebDimensionSnapshotEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'brand_id' })
  brandId: number;

  @Column({ name: 'connection_id' })
  connectionId: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'varchar', length: 16 })
  dimension: WebDimensionEnum;

  @Column({ name: 'dimension_value', type: 'varchar', length: 255 })
  dimensionValue: string;

  @Column({ type: 'int', default: 0 })
  sessions: number;

  @Column({ type: 'int', default: 0 })
  users: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, default: 0 })
  conversions: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
