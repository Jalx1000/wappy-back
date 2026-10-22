import {
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

// Server-to-server API keys (one or more per brand). Only the SHA-256 hash is
// stored; the plaintext key is shown once at creation. keyHash is the lookup key.
@Entity({
  name: 'api_key',
})
@Index(['keyHash'], { unique: true })
@Index(['brandId'])
export class ApiKeyEntity extends EntityRelationalHelper {
  @Column({
    nullable: true,
    type: Date,
  })
  revokedAt?: Date | null;

  @Column({
    nullable: true,
    type: Date,
  })
  lastUsedAt?: Date | null;

  @Column({
    nullable: true,
    type: String,
  })
  label?: string | null;

  @Column({
    nullable: false,
    type: String,
  })
  environment: string;

  @Column({
    nullable: false,
    type: String,
  })
  keyPrefix: string;

  @Column({
    nullable: false,
    type: String,
  })
  keyHash: string;

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
