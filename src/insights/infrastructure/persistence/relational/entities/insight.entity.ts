import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'insight' })
@Unique(['brandId', 'period'])
export class InsightEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: Number })
  brandId: number;

  @Column({ type: Number, nullable: true })
  connectionId: number | null;

  @Column({ type: String })
  period: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'jsonb', default: [] })
  recommendations: string[];

  @CreateDateColumn()
  createdAt: Date;
}
