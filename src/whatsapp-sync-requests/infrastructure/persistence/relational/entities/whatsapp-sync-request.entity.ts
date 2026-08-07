import {
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Index('IDX_whatsapp_sync_request_connection', ['connectionId'])
@Entity({
  name: 'whatsapp_sync_request',
})
export class WhatsappSyncRequestEntity extends EntityRelationalHelper {
  @Column({
    nullable: true,
    type: Number,
  })
  progress?: number | null;

  @Column({
    nullable: true,
    type: Number,
  })
  phase?: number | null;

  @Column({
    nullable: true,
    type: String,
  })
  status?: string | null;

  @Column({
    nullable: false,
    type: String,
  })
  syncType: string;

  @Column({
    nullable: true,
    type: String,
  })
  requestId?: string | null;

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
