import {
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

// Index names must match the migration so TypeORM does not flag them as drift.
@Index('UQ_whatsapp_message_conn_external', ['connectionId', 'externalId'], {
  unique: true,
})
@Index('IDX_whatsapp_message_conversation', ['conversationId'])
@Index('IDX_whatsapp_message_conn_sent_at', ['connectionId', 'sentAt'])
@Entity({
  name: 'whatsapp_message',
})
export class WhatsappMessageEntity extends EntityRelationalHelper {
  // Raw type-specific object (image/audio/document/location/contacts/…) so the
  // UI can render each message type richly. jsonb (the generator has no jsonb
  // kind, so this column is hand-declared like connection.metadata).
  @Column({ type: 'jsonb', nullable: true })
  payload?: Record<string, unknown> | null;

  @Column({
    nullable: false,
    type: Date,
  })
  sentAt: Date;

  @Column({
    nullable: true,
    type: Date,
  })
  revokedAt?: Date | null;

  @Column({
    nullable: true,
    type: String,
  })
  editedFromId?: string | null;

  @Column({
    nullable: false,
    type: String,
  })
  source: string;

  @Column({
    nullable: true,
    type: String,
  })
  status?: string | null;

  @Column({
    nullable: true,
    type: String,
  })
  mediaUrl?: string | null;

  @Column({
    nullable: true,
    type: String,
  })
  mediaId?: string | null;

  @Column({
    nullable: true,
    type: String,
  })
  content?: string | null;

  @Column({
    nullable: false,
    type: String,
  })
  messageType: string;

  @Column({
    nullable: false,
    type: String,
  })
  direction: string;

  @Column({
    nullable: false,
    type: String,
  })
  externalId: string;

  @Column({
    nullable: false,
    type: String,
  })
  conversationId: string;

  @Column({
    nullable: false,
    type: Number,
  })
  connectionId: number;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
