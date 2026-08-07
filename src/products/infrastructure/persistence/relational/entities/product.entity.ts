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
import { BrandEntity } from '../../../../../brands/infrastructure/persistence/relational/entities/brand.entity';

@Entity({
  name: 'product',
})
export class ProductEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  sku: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int', default: 1 })
  stock: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image: string | null;

  @Column({ type: Boolean, default: true })
  isActive: boolean;

  @Column({ length: 255 })
  category: string;

  @Index()
  @Column({ type: 'int' })
  brandId: number;

  @ManyToOne(() => BrandEntity, { onDelete: 'CASCADE' })
  brand: BrandEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
