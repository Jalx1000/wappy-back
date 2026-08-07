import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { WhatsappConversationEntity } from '../entities/whatsapp-conversation.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { WhatsappConversation } from '../../../../domain/whatsapp-conversation';
import { WhatsappConversationRepository } from '../../whatsapp-conversation.repository';
import { WhatsappConversationMapper } from '../mappers/whatsapp-conversation.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class WhatsappConversationRelationalRepository implements WhatsappConversationRepository {
  constructor(
    @InjectRepository(WhatsappConversationEntity)
    private readonly whatsappConversationRepository: Repository<WhatsappConversationEntity>,
  ) {}

  async create(data: WhatsappConversation): Promise<WhatsappConversation> {
    const persistenceModel = WhatsappConversationMapper.toPersistence(data);
    const newEntity = await this.whatsappConversationRepository.save(
      this.whatsappConversationRepository.create(persistenceModel),
    );
    return WhatsappConversationMapper.toDomain(newEntity);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<WhatsappConversation[]> {
    const entities = await this.whatsappConversationRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });

    return entities.map((entity) =>
      WhatsappConversationMapper.toDomain(entity),
    );
  }

  async findById(
    id: WhatsappConversation['id'],
  ): Promise<NullableType<WhatsappConversation>> {
    const entity = await this.whatsappConversationRepository.findOne({
      where: { id },
    });

    return entity ? WhatsappConversationMapper.toDomain(entity) : null;
  }

  async findByIds(
    ids: WhatsappConversation['id'][],
  ): Promise<WhatsappConversation[]> {
    const entities = await this.whatsappConversationRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) =>
      WhatsappConversationMapper.toDomain(entity),
    );
  }

  async findByConnectionAndUser(
    connectionId: number,
    waUserPhone: string,
  ): Promise<NullableType<WhatsappConversation>> {
    const entity = await this.whatsappConversationRepository.findOne({
      where: { connectionId, waUserPhone },
    });

    return entity ? WhatsappConversationMapper.toDomain(entity) : null;
  }

  async findByConnectionIds(
    connectionIds: number[],
  ): Promise<WhatsappConversation[]> {
    if (connectionIds.length === 0) return [];
    const entities = await this.whatsappConversationRepository.find({
      where: { connectionId: In(connectionIds) },
      order: { lastMessageAt: 'DESC' },
    });

    return entities.map((entity) =>
      WhatsappConversationMapper.toDomain(entity),
    );
  }

  async update(
    id: WhatsappConversation['id'],
    payload: Partial<WhatsappConversation>,
  ): Promise<WhatsappConversation> {
    const entity = await this.whatsappConversationRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Record not found');
    }

    const updatedEntity = await this.whatsappConversationRepository.save(
      this.whatsappConversationRepository.create(
        WhatsappConversationMapper.toPersistence({
          ...WhatsappConversationMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return WhatsappConversationMapper.toDomain(updatedEntity);
  }

  async remove(id: WhatsappConversation['id']): Promise<void> {
    await this.whatsappConversationRepository.delete(id);
  }
}
