import {
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

// One thread per (connection, PSID) — the resolve key on ingestion.
@Index('UQ_messenger_conversation_conn_psid', ['connectionId', 'psid'], {
  unique: true,
})
@Index('IDX_messenger_conversation_contact', ['contactId'])
@Entity({ name: 'messenger_conversation' })
export class MessengerConversationEntity extends EntityRelationalHelper {
  @Column({ nullable: true, type: String })
  contactId?: string | null;

  @Column({ nullable: true, type: Date })
  lastMessageAt?: Date | null;

  @Column({ nullable: false, type: String })
  psid: string;

  @Column({ nullable: true, type: String })
  peerName?: string | null;

  @Column({ nullable: false, type: Number })
  connectionId: number;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
