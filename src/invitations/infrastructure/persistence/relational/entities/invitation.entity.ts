import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({
  name: 'invitation',
})
export class InvitationEntity extends EntityRelationalHelper {
  @Column({
    nullable: true,
    type: Number,
  })
  invitedByUserId?: number | null;

  @Column({
    nullable: false,
    type: Number,
  })
  brandId?: number;

  @Column({
    nullable: false,
    type: String,
  })
  status?: string;

  @Column({
    nullable: false,
    type: String,
  })
  token?: string;

  @Column({
    nullable: true,
    type: String,
  })
  role?: string | null;

  @Column({
    nullable: true,
    type: String,
  })
  phone?: string | null;

  @Column({
    nullable: true,
    type: String,
  })
  email?: string | null;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
