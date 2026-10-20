import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({
  name: 'conversation_state',
})
export class ConversationStateEntity extends EntityRelationalHelper {
  @Column({
    nullable: true,
    type: Number,
  })
  resolvedByUserId?: number | null;

  @Column({
    nullable: true,
    type: Date,
  })
  resolvedAt?: Date | null;

  @Column({
    nullable: true,
    type: Date,
  })
  firstResponseAt?: Date | null;

  @Column({
    nullable: true,
    type: Date,
  })
  firstInboundAt?: Date | null;

  @Column({
    nullable: false,
    type: String,
  })
  status: string;

  @Column({
    nullable: false,
    type: Number,
  })
  brandId: number;

  @Column({
    nullable: false,
    type: String,
  })
  channel: string;

  @Column({
    nullable: false,
    type: String,
  })
  conversationId: string;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
