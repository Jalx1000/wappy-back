import {
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({
  name: 'category',
})
// One registry row per (brand, name): a flat category taxonomy materialized
// from product writes. Scoped per brand; names are unique within a brand.
@Index(['brandId', 'name'], { unique: true })
export class CategoryEntity extends EntityRelationalHelper {
  @Index()
  @Column({
    nullable: false,
    type: Number,
  })
  brandId: number;

  @Column({
    nullable: false,
    type: String,
  })
  name: string;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
