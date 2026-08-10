import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({
  name: 'conversation_assignment',
})
export class ConversationAssignmentEntity extends EntityRelationalHelper {
  @Column({
    nullable: true,
    type: String,
  })
  assignedTeamId?: string | null;

  @Column({
    nullable: true,
    type: Number,
  })
  assignedUserId?: number | null;

  @Column({
    nullable: false,
    type: Number,
  })
  brandId?: number;

  @Column({
    nullable: false,
    type: String,
  })
  channel?: string;

  @Column({
    nullable: false,
    type: String,
  })
  conversationId?: string;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
