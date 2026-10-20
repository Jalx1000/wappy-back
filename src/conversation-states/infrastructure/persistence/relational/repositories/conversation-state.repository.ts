import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConversationStateEntity } from '../entities/conversation-state.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { ConversationState } from '../../../../domain/conversation-state';
import { ConversationStateRepository } from '../../conversation-state.repository';
import { ConversationStateMapper } from '../mappers/conversation-state.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class ConversationStateRelationalRepository implements ConversationStateRepository {
  constructor(
    @InjectRepository(ConversationStateEntity)
    private readonly conversationStateRepository: Repository<ConversationStateEntity>,
  ) {}

  async create(data: ConversationState): Promise<ConversationState> {
    const persistenceModel = ConversationStateMapper.toPersistence(data);
    const newEntity = await this.conversationStateRepository.save(
      this.conversationStateRepository.create(persistenceModel),
    );
    return ConversationStateMapper.toDomain(newEntity);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<ConversationState[]> {
    const entities = await this.conversationStateRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });

    return entities.map((entity) => ConversationStateMapper.toDomain(entity));
  }

  async findById(
    id: ConversationState['id'],
  ): Promise<NullableType<ConversationState>> {
    const entity = await this.conversationStateRepository.findOne({
      where: { id },
    });

    return entity ? ConversationStateMapper.toDomain(entity) : null;
  }

  async findByIds(
    ids: ConversationState['id'][],
  ): Promise<ConversationState[]> {
    const entities = await this.conversationStateRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => ConversationStateMapper.toDomain(entity));
  }

  async update(
    id: ConversationState['id'],
    payload: Partial<ConversationState>,
  ): Promise<ConversationState> {
    const entity = await this.conversationStateRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Record not found');
    }

    const updatedEntity = await this.conversationStateRepository.save(
      this.conversationStateRepository.create(
        ConversationStateMapper.toPersistence({
          ...ConversationStateMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return ConversationStateMapper.toDomain(updatedEntity);
  }

  async remove(id: ConversationState['id']): Promise<void> {
    await this.conversationStateRepository.delete(id);
  }

  async findByConversation(
    conversationId: string,
    channel: string,
  ): Promise<NullableType<ConversationState>> {
    const entity = await this.conversationStateRepository.findOne({
      where: { conversationId, channel },
    });
    return entity ? ConversationStateMapper.toDomain(entity) : null;
  }

  async findByBrand(brandId: number): Promise<ConversationState[]> {
    const entities = await this.conversationStateRepository.find({
      where: { brandId },
    });
    return entities.map((entity) => ConversationStateMapper.toDomain(entity));
  }
}
