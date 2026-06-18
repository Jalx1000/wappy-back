import { Injectable, NotFoundException } from '@nestjs/common';
import { ReportSchedule } from './domain/report-schedule';
import { ReportSchedulesRepository } from './infrastructure/persistence/relational/repositories/report-schedules.repository';
import { CreateReportScheduleDto } from './dto/create-report-schedule.dto';
import { UpdateReportScheduleDto } from './dto/update-report-schedule.dto';
import { ReportTypeEnum } from './domain/report-type.enum';
import { computeNextRun } from './schedule-time.util';

@Injectable()
export class ReportSchedulesService {
  constructor(private readonly repo: ReportSchedulesRepository) {}

  async create(
    brandId: number,
    userId: number | null,
    dto: CreateReportScheduleDto,
  ): Promise<ReportSchedule> {
    const base = {
      brandId,
      type: ReportTypeEnum.summary,
      frequency: dto.frequency,
      dayOfWeek: dto.dayOfWeek ?? null,
      dayOfMonth: dto.dayOfMonth ?? null,
      hour: dto.hour,
      timezone: dto.timezone ?? 'America/La_Paz',
      sections: dto.sections ?? [],
      memberUserIds: dto.memberUserIds ?? [],
      extraEmails: dto.extraEmails ?? [],
      enabled: dto.enabled ?? true,
      createdByUserId: userId,
      lastRunAt: null,
    };
    const nextRunAt = base.enabled ? computeNextRun(base) : null;
    return this.repo.create({ ...base, nextRunAt });
  }

  findAllForBrand(brandId: number): Promise<ReportSchedule[]> {
    return this.repo.findByBrandId(brandId);
  }

  async findOne(brandId: number, id: number): Promise<ReportSchedule> {
    const schedule = await this.repo.findByBrandIdAndId(brandId, id);
    if (!schedule) throw new NotFoundException(`Schedule #${id} not found`);
    return schedule;
  }

  async update(
    brandId: number,
    id: number,
    dto: UpdateReportScheduleDto,
  ): Promise<ReportSchedule> {
    const current = await this.findOne(brandId, id);
    const merged = {
      ...current,
      ...dto,
    };
    // Recompute next run whenever cadence-affecting fields or enabled change.
    const nextRunAt = merged.enabled
      ? computeNextRun({
          frequency: merged.frequency,
          dayOfWeek: merged.dayOfWeek,
          dayOfMonth: merged.dayOfMonth,
          hour: merged.hour,
          timezone: merged.timezone,
          lastRunAt: merged.lastRunAt,
        })
      : null;
    return this.repo.update(id, { ...dto, nextRunAt });
  }

  async remove(brandId: number, id: number): Promise<void> {
    await this.findOne(brandId, id);
    await this.repo.remove(id);
  }
}
