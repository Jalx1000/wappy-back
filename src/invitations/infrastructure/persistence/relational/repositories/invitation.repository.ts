import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { InvitationEntity } from '../entities/invitation.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { Invitation } from '../../../../domain/invitation';
import { InvitationRepository } from '../../invitation.repository';
import { InvitationMapper } from '../mappers/invitation.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class InvitationRelationalRepository implements InvitationRepository {
  constructor(
    @InjectRepository(InvitationEntity)
    private readonly invitationRepository: Repository<InvitationEntity>,
  ) {}

  async create(data: Invitation): Promise<Invitation> {
    const persistenceModel = InvitationMapper.toPersistence(data);
    const newEntity = await this.invitationRepository.save(
      this.invitationRepository.create(persistenceModel),
    );
    return InvitationMapper.toDomain(newEntity);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<Invitation[]> {
    const entities = await this.invitationRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });

    return entities.map((entity) => InvitationMapper.toDomain(entity));
  }

  async findById(id: Invitation['id']): Promise<NullableType<Invitation>> {
    const entity = await this.invitationRepository.findOne({
      where: { id },
    });

    return entity ? InvitationMapper.toDomain(entity) : null;
  }

  async findByIds(ids: Invitation['id'][]): Promise<Invitation[]> {
    const entities = await this.invitationRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => InvitationMapper.toDomain(entity));
  }

  async findByToken(token: string): Promise<NullableType<Invitation>> {
    const entity = await this.invitationRepository.findOne({
      where: { token },
    });
    return entity ? InvitationMapper.toDomain(entity) : null;
  }

  async findPendingByBrandId(brandId: number): Promise<Invitation[]> {
    const entities = await this.invitationRepository.find({
      where: { brandId, status: 'pending' },
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => InvitationMapper.toDomain(entity));
  }

  async update(
    id: Invitation['id'],
    payload: Partial<Invitation>,
  ): Promise<Invitation> {
    const entity = await this.invitationRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Record not found');
    }

    const updatedEntity = await this.invitationRepository.save(
      this.invitationRepository.create(
        InvitationMapper.toPersistence({
          ...InvitationMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return InvitationMapper.toDomain(updatedEntity);
  }

  async remove(id: Invitation['id']): Promise<void> {
    await this.invitationRepository.delete(id);
  }
}
