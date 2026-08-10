import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TeamEntity } from '../entities/team.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { Team } from '../../../../domain/team';
import { TeamRepository } from '../../team.repository';
import { TeamMapper } from '../mappers/team.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class TeamRelationalRepository implements TeamRepository {
  constructor(
    @InjectRepository(TeamEntity)
    private readonly teamRepository: Repository<TeamEntity>,
  ) {}

  async create(data: Team): Promise<Team> {
    const persistenceModel = TeamMapper.toPersistence(data);
    const newEntity = await this.teamRepository.save(
      this.teamRepository.create(persistenceModel),
    );
    return TeamMapper.toDomain(newEntity);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<Team[]> {
    const entities = await this.teamRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });

    return entities.map((entity) => TeamMapper.toDomain(entity));
  }

  async findById(id: Team['id']): Promise<NullableType<Team>> {
    const entity = await this.teamRepository.findOne({
      where: { id },
    });

    return entity ? TeamMapper.toDomain(entity) : null;
  }

  async findByIds(ids: Team['id'][]): Promise<Team[]> {
    const entities = await this.teamRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => TeamMapper.toDomain(entity));
  }

  async findByBrandId(brandId: number): Promise<Team[]> {
    // members is eager, so they come loaded.
    const entities = await this.teamRepository.find({
      where: { brandId },
      order: { createdAt: 'ASC' },
    });
    return entities.map((entity) => TeamMapper.toDomain(entity));
  }

  async addMember(teamId: Team['id'], userId: number): Promise<void> {
    await this.teamRepository
      .createQueryBuilder()
      .relation(TeamEntity, 'members')
      .of(teamId)
      .add(userId);
  }

  async removeMember(teamId: Team['id'], userId: number): Promise<void> {
    await this.teamRepository
      .createQueryBuilder()
      .relation(TeamEntity, 'members')
      .of(teamId)
      .remove(userId);
  }

  async update(id: Team['id'], payload: Partial<Team>): Promise<Team> {
    const entity = await this.teamRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Record not found');
    }

    const updatedEntity = await this.teamRepository.save(
      this.teamRepository.create(
        TeamMapper.toPersistence({
          ...TeamMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return TeamMapper.toDomain(updatedEntity);
  }

  async remove(id: Team['id']): Promise<void> {
    await this.teamRepository.delete(id);
  }
}
