import {
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { OrderItem } from '../../../../domain/order-item';

// N orders per contact: a "lead" card auto-created on first contact, plus a
// purchase order per WooCommerce checkout. contactId is indexed (non-unique);
// (brandId, externalId) is unique so a retried checkout never duplicates.
@Entity({
  name: 'order',
})
@Index(['contactId'])
@Index(['brandId'])
@Index(['brandId', 'externalId'], { unique: true })
export class OrderEntity extends EntityRelationalHelper {
  @Column({
    nullable: true,
    type: String,
  })
  notes?: string | null;

  @Column({
    nullable: false,
    type: String,
    default: 'lead',
  })
  source?: string;

  @Column({
    nullable: true,
    type: String,
  })
  externalId?: string | null;

  @Column({
    nullable: true,
    type: String,
  })
  orderNumber?: string | null;

  @Column({
    nullable: true,
    type: 'jsonb',
  })
  items?: OrderItem[] | null;

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
