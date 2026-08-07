import {
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Index('IDX_contact_brand', ['brandId'])
@Entity({
  name: 'contact',
})
export class ContactEntity extends EntityRelationalHelper {
  @Column({
    nullable: true,
    type: String,
  })
  mergedIntoContactId?: string | null;

  @Column({
    nullable: true,
    type: String,
  })
  notes?: string | null;

  @Column({
    nullable: true,
    type: String,
  })
  avatarUrl?: string | null;

  @Column({
    nullable: true,
    type: String,
  })
  email?: string | null;

  @Column({
    nullable: true,
    type: String,
  })
  phone?: string | null;

  @Column({
    nullable: true,
    type: String,
  })
  displayName?: string | null;

  @Column({
    nullable: false,
    type: Number,
  })
  brandId: number;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
