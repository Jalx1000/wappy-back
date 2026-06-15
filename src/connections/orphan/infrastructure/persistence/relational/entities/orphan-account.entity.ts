import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChannelEnum } from '../../../../../domain/channel.enum';

@Entity('orphan_account')
@Index(['channel', 'accountId'], { unique: true })
@Index(['channel'])
export class OrphanAccountEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 40 })
  channel: ChannelEnum;

  @Column({ name: 'account_id', type: 'varchar', length: 255 })
  accountId: string;

  @Column({ name: 'account_handle', type: 'varchar', length: 255 })
  accountHandle: string;

  @Column({ name: 'access_token', type: 'text' })
  accessToken: string;

  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  refreshToken: string | null;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  scopes: string[];

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @Column({ name: 'discovered_by_user_id', type: 'int' })
  discoveredByUserId: number;

  @CreateDateColumn({ name: 'discovered_at' })
  discoveredAt: Date;
}
