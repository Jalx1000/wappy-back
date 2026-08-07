import { ReportSchedule } from '../../../../domain/report-schedule';
import { ReportScheduleEntity } from '../entities/report-schedule.entity';

export class ReportScheduleMapper {
  static toDomain(entity: ReportScheduleEntity): ReportSchedule {
    const d = new ReportSchedule();
    d.id = entity.id;
    d.brandId = entity.brandId;
    d.type = entity.type;
    d.frequency = entity.frequency;
    d.dayOfWeek = entity.dayOfWeek;
    d.dayOfMonth = entity.dayOfMonth;
    d.hour = entity.hour;
    d.timezone = entity.timezone;
    d.sections = entity.sections ?? [];
    d.memberUserIds = entity.memberUserIds ?? [];
    d.extraEmails = entity.extraEmails ?? [];
    d.enabled = entity.enabled;
    d.lastRunAt = entity.lastRunAt;
    d.nextRunAt = entity.nextRunAt;
    d.createdByUserId = entity.createdByUserId;
    d.createdAt = entity.createdAt;
    d.updatedAt = entity.updatedAt;
    return d;
  }

  static toPersistence(
    domain: Partial<ReportSchedule>,
  ): Partial<ReportScheduleEntity> {
    const e = new ReportScheduleEntity();
    if (domain.brandId !== undefined) e.brandId = domain.brandId;
    if (domain.type !== undefined) e.type = domain.type;
    if (domain.frequency !== undefined) e.frequency = domain.frequency;
    if (domain.dayOfWeek !== undefined) e.dayOfWeek = domain.dayOfWeek;
    if (domain.dayOfMonth !== undefined) e.dayOfMonth = domain.dayOfMonth;
    if (domain.hour !== undefined) e.hour = domain.hour;
    if (domain.timezone !== undefined) e.timezone = domain.timezone;
    if (domain.sections !== undefined) e.sections = domain.sections;
    if (domain.memberUserIds !== undefined)
      e.memberUserIds = domain.memberUserIds;
    if (domain.extraEmails !== undefined) e.extraEmails = domain.extraEmails;
    if (domain.enabled !== undefined) e.enabled = domain.enabled;
    if (domain.lastRunAt !== undefined) e.lastRunAt = domain.lastRunAt;
    if (domain.nextRunAt !== undefined) e.nextRunAt = domain.nextRunAt;
    if (domain.createdByUserId !== undefined)
      e.createdByUserId = domain.createdByUserId;
    return e;
  }
}
