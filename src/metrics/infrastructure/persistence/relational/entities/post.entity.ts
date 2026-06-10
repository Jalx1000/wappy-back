import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'social_post' })
export class PostEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: Number })
  brandId: number;

  @Index()
  @Column({ type: Number })
  connectionId: number;

  @Index({ unique: true })
  @Column({ type: String })
  externalId: string;

  @Column({ type: 'timestamptz' })
  publishedAt: Date;

  @Column({ type: String })
  type: string;

  @Column({ type: String, nullable: true })
  caption: string | null;

  @Column({ type: String, nullable: true })
  mediaUrl: string | null;

  @Column({ type: 'jsonb', default: {} })
  metrics: Record<string, number>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
