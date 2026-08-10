import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { MessengerConversationEntity } from '../entities/messenger-conversation.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { MessengerConversation } from '../../../../domain/messenger-conversation';
import { MessengerConversationRepository } from '../../messenger-conversation.repository';
import { MessengerConversationMapper } from '../mappers/messenger-conversation.mapper';

@Injectable()
export class MessengerConversationRelationalRepository implements MessengerConversationRepository {
  constructor(
    @InjectRepository(MessengerConversationEntity)
    private readonly repo: Repository<MessengerConversationEntity>,
  ) {}

  async create(data: MessengerConversation): Promise<MessengerConversation> {
    const persistenceModel = MessengerConversationMapper.toPersistence(data);
    const newEntity = await this.repo.save(this.repo.create(persistenceModel));
    return MessengerConversationMapper.toDomain(newEntity);
  }

  async findById(
    id: MessengerConversation['id'],
  ): Promise<NullableType<MessengerConversation>> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? MessengerConversationMapper.toDomain(entity) : null;
  }

  async findByConnectionAndUser(
    connectionId: number,
    psid: string,
  ): Promise<NullableType<MessengerConversation>> {
    const entity = await this.repo.findOne({
      where: { connectionId, psid },
    });
    return entity ? MessengerConversationMapper.toDomain(entity) : null;
  }

  async findByConnectionIds(
    connectionIds: number[],
  ): Promise<MessengerConversation[]> {
    if (connectionIds.length === 0) return [];
    const entities = await this.repo.find({
      where: { connectionId: In(connectionIds) },
      order: { lastMessageAt: 'DESC' },
    });
    return entities.map((e) => MessengerConversationMapper.toDomain(e));
  }

  async findMissingProfile(): Promise<MessengerConversation[]> {
    const entities = await this.repo.find({
      where: { peerName: IsNull() },
    });
    return entities.map((e) => MessengerConversationMapper.toDomain(e));
  }

  async findAll(): Promise<MessengerConversation[]> {
    const entities = await this.repo.find();
    return entities.map((e) => MessengerConversationMapper.toDomain(e));
  }

  async update(
    id: MessengerConversation['id'],
    payload: Partial<MessengerConversation>,
  ): Promise<MessengerConversation> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      throw new Error('Record not found');
    }
    const updatedEntity = await this.repo.save(
      this.repo.create(
        MessengerConversationMapper.toPersistence({
          ...MessengerConversationMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );
    return MessengerConversationMapper.toDomain(updatedEntity);
  }
}
