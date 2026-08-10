import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConversationAssignmentEntity } from '../entities/conversation-assignment.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { ConversationAssignment } from '../../../../domain/conversation-assignment';
import {
  AssignmentInput,
  ConversationAssignmentRepository,
} from '../../conversation-assignment.repository';
import { ConversationAssignmentMapper } from '../mappers/conversation-assignment.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class ConversationAssignmentRelationalRepository implements ConversationAssignmentRepository {
  constructor(
    @InjectRepository(ConversationAssignmentEntity)
    private readonly conversationAssignmentRepository: Repository<ConversationAssignmentEntity>,
  ) {}

  async create(data: ConversationAssignment): Promise<ConversationAssignment> {
    const persistenceModel = ConversationAssignmentMapper.toPersistence(data);
    const newEntity = await this.conversationAssignmentRepository.save(
      this.conversationAssignmentRepository.create(persistenceModel),
    );
    return ConversationAssignmentMapper.toDomain(newEntity);
  }

  async findByConversationId(
    conversationId: string,
  ): Promise<NullableType<ConversationAssignment>> {
    const entity = await this.conversationAssignmentRepository.findOne({
      where: { conversationId },
    });
    return entity ? ConversationAssignmentMapper.toDomain(entity) : null;
  }

  async findByConversationIds(
    conversationIds: string[],
  ): Promise<ConversationAssignment[]> {
    if (conversationIds.length === 0) return [];
    const entities = await this.conversationAssignmentRepository.find({
      where: { conversationId: In(conversationIds) },
    });
    return entities.map((e) => ConversationAssignmentMapper.toDomain(e));
  }

  async upsert(input: AssignmentInput): Promise<ConversationAssignment> {
    const existing = await this.conversationAssignmentRepository.findOne({
      where: { conversationId: input.conversationId },
    });
    if (existing) {
      await this.conversationAssignmentRepository.update(existing.id, {
        channel: input.channel,
        brandId: input.brandId,
        assignedUserId: input.assignedUserId,
        assignedTeamId: input.assignedTeamId,
      });
      const updated = await this.conversationAssignmentRepository.findOne({
        where: { id: existing.id },
      });
      return ConversationAssignmentMapper.toDomain(updated ?? existing);
    }
    const saved = await this.conversationAssignmentRepository.save(
      this.conversationAssignmentRepository.create({
        conversationId: input.conversationId,
        channel: input.channel,
        brandId: input.brandId,
        assignedUserId: input.assignedUserId,
        assignedTeamId: input.assignedTeamId,
      }),
    );
    return ConversationAssignmentMapper.toDomain(saved);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<ConversationAssignment[]> {
    const entities = await this.conversationAssignmentRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });

    return entities.map((entity) =>
      ConversationAssignmentMapper.toDomain(entity),
    );
  }

  async findById(
    id: ConversationAssignment['id'],
  ): Promise<NullableType<ConversationAssignment>> {
    const entity = await this.conversationAssignmentRepository.findOne({
      where: { id },
    });

    return entity ? ConversationAssignmentMapper.toDomain(entity) : null;
  }

  async findByIds(
    ids: ConversationAssignment['id'][],
  ): Promise<ConversationAssignment[]> {
    const entities = await this.conversationAssignmentRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) =>
      ConversationAssignmentMapper.toDomain(entity),
    );
  }

  async update(
    id: ConversationAssignment['id'],
    payload: Partial<ConversationAssignment>,
  ): Promise<ConversationAssignment> {
    const entity = await this.conversationAssignmentRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Record not found');
    }

    const updatedEntity = await this.conversationAssignmentRepository.save(
      this.conversationAssignmentRepository.create(
        ConversationAssignmentMapper.toPersistence({
          ...ConversationAssignmentMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return ConversationAssignmentMapper.toDomain(updatedEntity);
  }

  async remove(id: ConversationAssignment['id']): Promise<void> {
    await this.conversationAssignmentRepository.delete(id);
  }
}
