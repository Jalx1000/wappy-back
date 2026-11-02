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
import type { ProductAttribute } from '../../../../domain/product';

@Entity({
  name: 'product',
})
// Upsert key for external integrations (e.g. WooCommerce `wc_<id>`); unique per
// brand. externalId is nullable so dashboard-created products coexist (Postgres
// allows multiple NULLs in a unique index).
@Index(['brandId', 'externalId'], { unique: true })
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

  // External system id for integration upsert (e.g. `wc_128`). Null for
  // products created from the dashboard.
  @Column({ type: 'varchar', length: 100, nullable: true })
  externalId: string | null;

  // Typed custom attributes mirrored from the source catalog. jsonb so the
  // public contract (see docs/contracts/products-sync.md §3) can grow without a
  // migration, and forward-compatible with the custom-fields engine.
  @Column({ type: 'jsonb', nullable: true })
  attributes: ProductAttribute[] | null;

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
