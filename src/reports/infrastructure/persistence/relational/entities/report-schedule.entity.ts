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
import { ReportFrequencyEnum } from '../../../../domain/report-frequency.enum';

@Entity({ name: 'report_schedule' })
export class ReportScheduleEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: Number })
  brandId: number;

  @Column({ type: String, enum: ReportTypeEnum, default: ReportTypeEnum.summary })
  type: ReportTypeEnum;

  @Column({ type: String, enum: ReportFrequencyEnum })
  frequency: ReportFrequencyEnum;

  @Column({ type: Number, nullable: true })
  dayOfWeek: number | null;

  @Column({ type: Number, nullable: true })
  dayOfMonth: number | null;

  @Column({ type: Number, default: 8 })
  hour: number;

  @Column({ type: String, default: 'America/La_Paz' })
  timezone: string;

  @Column({ type: 'jsonb', default: [] })
  sections: string[];

  @Column({ type: 'jsonb', default: [] })
  memberUserIds: number[];

  @Column({ type: 'jsonb', default: [] })
  extraEmails: string[];

  @Column({ type: Boolean, default: true })
  enabled: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastRunAt: Date | null;

  @Index()
  @Column({ type: 'timestamptz', nullable: true })
  nextRunAt: Date | null;

  @Column({ type: Number, nullable: true })
  createdByUserId: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
