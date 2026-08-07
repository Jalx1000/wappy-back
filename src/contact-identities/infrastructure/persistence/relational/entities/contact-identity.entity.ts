import {
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

// One identity per (channel, connection, external id) — the upsert key.
@Index(
  'UQ_contact_identity_channel_conn_external',
  ['channel', 'connectionId', 'externalId'],
  { unique: true },
)
@Index('IDX_contact_identity_contact', ['contactId'])
@Entity({
  name: 'contact_identity',
})
export class ContactIdentityEntity extends EntityRelationalHelper {
  @Column({
    nullable: true,
    type: String,
  })
  phone?: string | null;

  @Column({
    nullable: true,
    type: String,
  })
  profileName?: string | null;

  @Column({
    nullable: true,
    type: String,
  })
  handle?: string | null;

  @Column({
    nullable: false,
    type: String,
  })
  externalId: string;

  @Column({
    nullable: true,
    type: Number,
  })
  connectionId?: number | null;

  @Column({
    nullable: false,
    type: String,
  })
  channel: string;

  @Column({
    nullable: false,
    type: String,
  })
  contactId: string;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
