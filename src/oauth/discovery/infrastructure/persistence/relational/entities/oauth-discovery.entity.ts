import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OAuthDiscoveryAccount } from '../../../../domain/oauth-discovery';

@Entity('oauth_discovery')
@Index(['userId', 'expiresAt'])
@Index(['expiresAt'])
export class OAuthDiscoveryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ type: 'varchar', length: 40 })
  channel: string;

  @Column({ name: 'triggered_brand_id', type: 'int', nullable: true })
  triggeredBrandId: number | null;

  @Column({ type: 'jsonb' })
  accounts: OAuthDiscoveryAccount[];

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'consumed_at', type: 'timestamp', nullable: true })
  consumedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
