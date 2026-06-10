import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { ReportTypeEnum } from '../../../../domain/report-type.enum';
import { ReportStatusEnum } from '../../../../domain/report-status.enum';
import { ReportParams } from '../../../../domain/report';

@Entity({ name: 'report' })
export class ReportEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: Number })
  brandId: number;

  @Column({ type: String, enum: ReportTypeEnum })
  type: ReportTypeEnum;

  @Column({ type: String, enum: ReportStatusEnum, default: ReportStatusEnum.pending })
  status: ReportStatusEnum;

  @Column({ type: 'jsonb' })
  params: ReportParams;

  @Column({ type: String, nullable: true })
  fileUrl: string | null;

  @Column({ type: String, nullable: true })
  errorMessage: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
