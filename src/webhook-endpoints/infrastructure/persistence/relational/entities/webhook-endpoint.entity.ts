import {
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

// Outbound webhook target per brand (brief §3). The `secret` signs every
// delivery with HMAC-SHA256 so the receiver can verify authenticity.
@Entity({
  name: 'webhook_endpoint',
})
@Index(['brandId'])
export class WebhookEndpointEntity extends EntityRelationalHelper {
  @Column({
    nullable: false,
    type: Boolean,
    default: true,
  })
  active?: boolean;

  @Column({
    nullable: false,
    type: String,
  })
  secret: string;

  @Column({
    nullable: false,
    type: String,
  })
  url: string;

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
