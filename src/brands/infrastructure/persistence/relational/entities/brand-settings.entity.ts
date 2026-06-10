import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { BrandEntity } from './brand.entity';

@Entity({ name: 'brand_settings' })
export class BrandSettingsEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: Number, unique: true })
  brandId: number;

  @Column({ type: String, nullable: true })
  primaryColor: string | null;

  @Column({ type: String, nullable: true })
  secondaryColor: string | null;

  @Column({ type: String, nullable: true })
  logoPath: string | null;

  @Column({ type: String, nullable: true })
  customDomain: string | null;

  @Column({ type: String, nullable: true })
  contactEmail: string | null;

  @Column({ type: String, nullable: true })
  customCss: string | null;

  @OneToOne(() => BrandEntity, (b) => b.settings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brandId' })
  brand: BrandEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
