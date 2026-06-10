import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { BrandEntity } from './brand.entity';
import { BrandMemberRoleEnum } from '../../../../domain/brand-membership';

@Entity({ name: 'brand_membership' })
@Index(['userId', 'brandId'], { unique: true })
export class BrandMembershipEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: Number })
  userId: number;

  @Index()
  @Column({ type: Number })
  brandId: number;

  @Column({ type: String, default: BrandMemberRoleEnum.member })
  role: BrandMemberRoleEnum;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user: UserEntity;

  @ManyToOne(() => BrandEntity, (b) => b.memberships, { onDelete: 'CASCADE' })
  brand: BrandEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
