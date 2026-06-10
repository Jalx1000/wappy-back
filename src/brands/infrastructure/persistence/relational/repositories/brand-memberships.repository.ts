import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandMembership, BrandMemberRoleEnum } from '../../../../domain/brand-membership';
import { BrandMembershipEntity } from '../entities/brand-membership.entity';
import { BrandMembershipMapper } from '../mappers/brand-membership.mapper';
import { NullableType } from '../../../../../utils/types/nullable.type';

@Injectable()
export class BrandMembershipsRepository {
  constructor(
    @InjectRepository(BrandMembershipEntity)
    private readonly repo: Repository<BrandMembershipEntity>,
  ) {}

  async create(data: BrandMembership): Promise<BrandMembership> {
    const entity = await this.repo.save(
      this.repo.create(BrandMembershipMapper.toPersistence(data)),
    );
    return BrandMembershipMapper.toDomain(entity);
  }

  async findByUserId(userId: number): Promise<BrandMembership[]> {
    const entities = await this.repo.find({ where: { userId } });
    return entities.map(BrandMembershipMapper.toDomain);
  }

  async findBrandIdsByUserId(userId: number): Promise<number[]> {
    const memberships = await this.repo.find({
      where: { userId },
      select: ['brandId'],
    });
    return memberships.map((m) => m.brandId);
  }

  async findByBrandId(brandId: number): Promise<BrandMembership[]> {
    const entities = await this.repo.find({ where: { brandId } });
    return entities.map(BrandMembershipMapper.toDomain);
  }

  async findOne(userId: number, brandId: number): Promise<NullableType<BrandMembership>> {
    const entity = await this.repo.findOne({ where: { userId, brandId } });
    return entity ? BrandMembershipMapper.toDomain(entity) : null;
  }

  async upsert(userId: number, brandId: number, role: BrandMemberRoleEnum): Promise<BrandMembership> {
    const existing = await this.repo.findOne({ where: { userId, brandId } });
    if (existing) {
      await this.repo.update(existing.id, { role });
      existing.role = role;
      return BrandMembershipMapper.toDomain(existing);
    }
    const entity = await this.repo.save(
      this.repo.create({ userId, brandId, role }),
    );
    return BrandMembershipMapper.toDomain(entity);
  }

  async remove(userId: number, brandId: number): Promise<void> {
    await this.repo.delete({ userId, brandId });
  }
}
