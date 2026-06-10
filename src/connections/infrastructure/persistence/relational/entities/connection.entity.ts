import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { ChannelEnum } from '../../../../domain/channel.enum';
import { ConnectionStatusEnum } from '../../../../domain/connection-status.enum';

@Entity({ name: 'connection' })
export class ConnectionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: Number })
  brandId: number;

  @Column({ type: String, enum: ChannelEnum })
  channel: ChannelEnum;

  @Column({ type: String })
  accountHandle: string;

  @Column({ type: String })
  accountId: string;

  @Column({ type: String })
  accessToken: string;

  @Column({ type: String, nullable: true })
  refreshToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @Column({ type: String, enum: ConnectionStatusEnum, default: ConnectionStatusEnum.pending })
  status: ConnectionStatusEnum;

  @Column({ type: 'timestamptz', nullable: true })
  lastSyncAt: Date | null;

  @Column({ type: 'jsonb', default: [] })
  scopes: string[];

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
