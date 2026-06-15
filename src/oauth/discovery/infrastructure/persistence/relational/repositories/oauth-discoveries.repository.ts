import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { OAuthDiscoveryEntity } from '../entities/oauth-discovery.entity';
import { OAuthDiscovery } from '../../../../domain/oauth-discovery';
import { OAuthDiscoveryMapper } from '../mappers/oauth-discovery.mapper';

@Injectable()
export class OAuthDiscoveriesRepository {
  constructor(
    @InjectRepository(OAuthDiscoveryEntity)
    private readonly repo: Repository<OAuthDiscoveryEntity>,
    private readonly mapper: OAuthDiscoveryMapper,
  ) {}

  async create(domain: OAuthDiscovery): Promise<OAuthDiscovery> {
    const entity = this.mapper.toEntity(domain);
    const saved = await this.repo.save(entity);
    return this.mapper.toDomain(saved);
  }

  async findById(id: number): Promise<OAuthDiscovery | null> {
    const e = await this.repo.findOne({ where: { id } });
    return e ? this.mapper.toDomain(e) : null;
  }

  async findByIdForUser(
    id: number,
    userId: number,
  ): Promise<OAuthDiscovery | null> {
    const e = await this.repo.findOne({ where: { id, userId } });
    return e ? this.mapper.toDomain(e) : null;
  }

  async markConsumed(id: number): Promise<void> {
    await this.repo.update(id, { consumedAt: new Date() });
  }

  async deleteExpired(now: Date = new Date()): Promise<number> {
    const result = await this.repo.delete({ expiresAt: LessThan(now) });
    return result.affected ?? 0;
  }
}
