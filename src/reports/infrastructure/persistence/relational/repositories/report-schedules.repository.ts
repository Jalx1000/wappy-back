import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { ReportSchedule } from '../../../../domain/report-schedule';
import { ReportScheduleEntity } from '../entities/report-schedule.entity';
import { ReportScheduleMapper } from '../mappers/report-schedule.mapper';

@Injectable()
export class ReportSchedulesRepository {
  constructor(
    @InjectRepository(ReportScheduleEntity)
    private readonly repo: Repository<ReportScheduleEntity>,
  ) {}

  async create(data: Partial<ReportSchedule>): Promise<ReportSchedule> {
    const entity = this.repo.create(ReportScheduleMapper.toPersistence(data));
    const saved = await this.repo.save(entity);
    return ReportScheduleMapper.toDomain(saved);
  }

  async findByBrandId(brandId: number): Promise<ReportSchedule[]> {
    const entities = await this.repo.find({
      where: { brandId },
      order: { createdAt: 'DESC' },
    });
    return entities.map(ReportScheduleMapper.toDomain);
  }

  async findById(id: number): Promise<ReportSchedule | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? ReportScheduleMapper.toDomain(entity) : null;
  }

  async findByBrandIdAndId(
    brandId: number,
    id: number,
  ): Promise<ReportSchedule | null> {
    const entity = await this.repo.findOne({ where: { brandId, id } });
    return entity ? ReportScheduleMapper.toDomain(entity) : null;
  }

  // Enabled schedules whose nextRunAt is in the past — picked up by the hourly scan.
  async findDue(now: Date): Promise<ReportSchedule[]> {
    const entities = await this.repo.find({
      where: {
        enabled: true,
        nextRunAt: LessThanOrEqual(now),
      },
    });
    return entities.map(ReportScheduleMapper.toDomain);
  }

  async update(
    id: number,
    patch: Partial<ReportSchedule>,
  ): Promise<ReportSchedule> {
    await this.repo.update(id, ReportScheduleMapper.toPersistence(patch));
    const updated = await this.repo.findOneOrFail({ where: { id } });
    return ReportScheduleMapper.toDomain(updated);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
