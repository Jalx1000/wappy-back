import {
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

// One thread per (connection, WhatsApp user); index name matches the migration.
@Index('UQ_whatsapp_conversation_conn_user', ['connectionId', 'waUserPhone'], {
  unique: true,
})
@Index('IDX_whatsapp_conversation_contact', ['contactId'])
@Entity({
  name: 'whatsapp_conversation',
})
export class WhatsappConversationEntity extends EntityRelationalHelper {
  @Column({
    nullable: true,
    type: String,
  })
  contactId?: string | null;

  @Column({
    nullable: true,
    type: Date,
  })
  lastMessageAt?: Date | null;

  @Column({
    nullable: false,
    type: String,
  })
  waUserPhone: string;

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
