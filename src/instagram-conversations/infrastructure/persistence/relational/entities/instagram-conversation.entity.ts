import {
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

// One thread per (connection, Instagram user) — the resolve key on ingestion.
@Index('UQ_instagram_conversation_conn_user', ['connectionId', 'igUserId'], {
  unique: true,
})
@Index('IDX_instagram_conversation_contact', ['contactId'])
@Entity({ name: 'instagram_conversation' })
export class InstagramConversationEntity extends EntityRelationalHelper {
  @Column({ nullable: true, type: String })
  contactId?: string | null;

  @Column({ nullable: true, type: Date })
  lastMessageAt?: Date | null;

  @Column({ nullable: false, type: String })
  igUserId: string;

  @Column({ nullable: true, type: String })
  peerUsername?: string | null;

  @Column({ nullable: false, type: Number })
  connectionId: number;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
