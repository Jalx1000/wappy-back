import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

// A post is unique per connection, not globally: the same Facebook/Instagram
// account can be connected under several brands, and each connection must own
// its own copy of the post so every brand sees its publications.
@Entity({ name: 'social_post' })
@Index('UQ_social_post_conn_external', ['connectionId', 'externalId'], {
  unique: true,
})
export class PostEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: Number })
  brandId: number;

  @Index()
  @Column({ type: Number })
  connectionId: number;

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
