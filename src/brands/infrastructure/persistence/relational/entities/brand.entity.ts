import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { BrandMembershipEntity } from './brand-membership.entity';
import { BrandSettingsEntity } from './brand-settings.entity';

@Entity({ name: 'brand' })
export class BrandEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: String })
  name: string;

  @Index({ unique: true })
  @Column({ type: String })
  slug: string;

  @Column({ type: String, nullable: true })
  description: string | null;

  @Column({ type: Boolean, default: true })
  isActive: boolean;

  @OneToMany(() => BrandMembershipEntity, (m) => m.brand, { cascade: true })
  memberships: BrandMembershipEntity[];

  @OneToOne(() => BrandSettingsEntity, (s) => s.brand, { cascade: true })
  settings: BrandSettingsEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
