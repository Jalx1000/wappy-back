import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from '../../../../domain/report';
import { ReportEntity } from '../entities/report.entity';
import { ReportMapper } from '../mappers/report.mapper';
import { ReportStatusEnum } from '../../../../domain/report-status.enum';

@Injectable()
export class ReportsRepository {
  constructor(
    @InjectRepository(ReportEntity)
    private readonly repo: Repository<ReportEntity>,
  ) {}

  async create(report: Partial<Report>): Promise<Report> {
    const entity = this.repo.create(ReportMapper.toPersistence(report));
    const saved = await this.repo.save(entity);
    return ReportMapper.toDomain(saved);
  }

  async findByBrandId(brandId: number): Promise<Report[]> {
    const entities = await this.repo.find({
      where: { brandId },
      order: { createdAt: 'DESC' },
    });
    return entities.map(ReportMapper.toDomain);
  }

  async findById(id: number): Promise<Report | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? ReportMapper.toDomain(entity) : null;
  }

  async findByBrandIdAndId(
    brandId: number,
    id: number,
  ): Promise<Report | null> {
    const entity = await this.repo.findOne({ where: { brandId, id } });
    return entity ? ReportMapper.toDomain(entity) : null;
  }

  async update(id: number, patch: Partial<Report>): Promise<Report> {
    await this.repo.update(id, ReportMapper.toPersistence(patch));
    const updated = await this.repo.findOneOrFail({ where: { id } });
    return ReportMapper.toDomain(updated);
  }

  async updateStatus(
    id: number,
    status: ReportStatusEnum,
    extra?: { fileUrl?: string | null; errorMessage?: string | null },
  ): Promise<void> {
    await this.repo.update(id, { status, ...extra });
  }
}
