import {
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

// One order per contact (the kanban card). Unique on contactId enforces
// idempotent auto-creation at the DB level; brandId indexed for board listing.
@Entity({
  name: 'order',
})
@Index(['contactId'], { unique: true })
@Index(['brandId'])
export class OrderEntity extends EntityRelationalHelper {
  @Column({
    nullable: true,
    type: String,
  })
  notes?: string | null;

  @Column({
    nullable: false,
    type: String,
    default: 'USD',
  })
  currency?: string;

  @Column({
    nullable: false,
    type: Number,
    default: 0,
  })
  total?: number;

  @Column({
    nullable: false,
    type: String,
  })
  status: string;

  @Column({
    nullable: false,
    type: String,
  })
  contactId: string;

  @Column({
    nullable: false,
    type: Number,
  })
  brandId: number;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
