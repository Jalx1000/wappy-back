import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({
  name: 'company',
})
export class CompanyEntity extends EntityRelationalHelper {
  @Column({
    nullable: true,
    type: String,
  })
  notes?: string | null;

  @Column({
    nullable: true,
    type: Number,
  })
  seats?: number | null;

  @Column({
    nullable: true,
    type: String,
  })
  plan?: string | null;

  @Column({
    nullable: true,
    type: String,
  })
  location?: string | null;

  @Column({
    nullable: true,
    type: String,
  })
  industry?: string | null;

  @Column({
    nullable: true,
    type: String,
  })
  domain?: string | null;

  @Column({
    nullable: false,
    type: Number,
  })
  brandId?: number;

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
