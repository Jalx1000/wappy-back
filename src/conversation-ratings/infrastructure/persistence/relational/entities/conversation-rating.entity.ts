import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({
  name: 'conversation_rating',
})
export class ConversationRatingEntity extends EntityRelationalHelper {
  @Column({
    nullable: true,
    type: Number,
  })
  agentUserId?: number | null;

  @Column({
    nullable: true,
    type: String,
  })
  comment?: string | null;

  @Column({
    nullable: false,
    type: Number,
  })
  brandId: number;

  @Column({
    nullable: false,
    type: String,
  })
  conversationId: string;

  @Column({
    nullable: false,
    type: String,
  })
  channel: string;

  @Column({
    nullable: false,
    type: Number,
  })
  score: number;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
