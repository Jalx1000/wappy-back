import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApprovalEntity } from '../entities/approval.entity';
import { Approval } from '../../../../domain/approval';
import { ApprovalMapper } from '../mappers/approval.mapper';

@Injectable()
export class ApprovalsRepository {
  constructor(
    @InjectRepository(ApprovalEntity)
    private readonly repo: Repository<ApprovalEntity>,
    private readonly mapper: ApprovalMapper,
  ) {}

  async findById(id: number): Promise<Approval | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByBrandAndStatus(brandId: number, status?: string): Promise<Approval[]> {
    const query = this.repo.createQueryBuilder('a')
      .where('a.brandId = :brandId', { brandId });

    if (status) {
      query.andWhere('a.status = :status', { status });
    }

    const entities = await query.orderBy('a.createdAt', 'DESC').getMany();
    return entities.map((e) => this.mapper.toDomain(e));
  }

  async findByAssetId(assetId: number): Promise<Approval[]> {
    const entities = await this.repo.find({
      where: { assetId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.mapper.toDomain(e));
  }

  async save(domain: Approval): Promise<Approval> {
    const entity = this.mapper.toEntity(domain);
    const saved = await this.repo.save(entity);
    return this.mapper.toDomain(saved);
  }
}
