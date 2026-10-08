import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentEntity } from '../entities/agent.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { Agent } from '../../../../domain/agent';
import { AgentRepository } from '../../agent.repository';
import { AgentMapper } from '../mappers/agent.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class AgentRelationalRepository implements AgentRepository {
  constructor(
    @InjectRepository(AgentEntity)
    private readonly agentRepository: Repository<AgentEntity>,
  ) {}

  async create(data: Agent): Promise<Agent> {
    const persistenceModel = AgentMapper.toPersistence(data);
    const newEntity = await this.agentRepository.save(
      this.agentRepository.create(persistenceModel),
    );
    return AgentMapper.toDomain(newEntity);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<Agent[]> {
    const entities = await this.agentRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => AgentMapper.toDomain(entity));
  }

  async findById(id: Agent['id']): Promise<NullableType<Agent>> {
    const entity = await this.agentRepository.findOne({
      where: { id },
    });

    return entity ? AgentMapper.toDomain(entity) : null;
  }

  async findByBrand(brandId: number): Promise<Agent[]> {
    const entities = await this.agentRepository.find({
      where: { brandId },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => AgentMapper.toDomain(entity));
  }

  async findEnabledByBrand(brandId: number): Promise<Agent[]> {
    const entities = await this.agentRepository.find({
      where: { brandId, enabled: true },
    });

    return entities.map((entity) => AgentMapper.toDomain(entity));
  }

  async update(id: Agent['id'], payload: Partial<Agent>): Promise<Agent> {
    const entity = await this.agentRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Record not found');
    }

    const updatedEntity = await this.agentRepository.save(
      this.agentRepository.create(
        AgentMapper.toPersistence({
          ...AgentMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return AgentMapper.toDomain(updatedEntity);
  }

  async remove(id: Agent['id']): Promise<void> {
    await this.agentRepository.delete(id);
  }
}
