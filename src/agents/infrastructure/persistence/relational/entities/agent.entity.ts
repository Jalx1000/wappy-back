import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
  Index,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({
  name: 'agent',
})
export class AgentEntity extends EntityRelationalHelper {
  @Index()
  @Column({
    nullable: false,
    type: Number,
  })
  brandId?: number;

  @Column({
    nullable: false,
    type: String,
  })
  name?: string;

  @Column({
    nullable: false,
    type: Boolean,
    default: false,
  })
  enabled?: boolean;

  @Column({
    nullable: false,
    type: String,
    default: 'anthropic',
  })
  provider?: string;

  @Column({
    nullable: false,
    type: String,
    default: 'claude-sonnet-4-6',
  })
  model?: string;

  @Column({
    nullable: true,
    type: 'text',
  })
  systemPrompt?: string | null;

  @Column({
    nullable: true,
    type: String,
  })
  effort?: string | null;

  @Column({
    nullable: true,
    type: 'simple-array',
  })
  toolsEnabled?: string[] | null;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
