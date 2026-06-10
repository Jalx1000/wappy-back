import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { MetricEnum } from '../../../../domain/metric.enum';

@Entity({ name: 'metric_snapshot' })
@Unique(['connectionId', 'metric', 'date'])
export class MetricSnapshotEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: Number })
  connectionId: number;

  @Index()
  @Column({ type: Number })
  brandId: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: String, enum: MetricEnum })
  metric: MetricEnum;

  @Column({ type: 'decimal', precision: 18, scale: 4 })
  value: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
