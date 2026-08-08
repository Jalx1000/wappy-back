import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { InstagramConversationEntity } from '../entities/instagram-conversation.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { InstagramConversation } from '../../../../domain/instagram-conversation';
import { InstagramConversationRepository } from '../../instagram-conversation.repository';
import { InstagramConversationMapper } from '../mappers/instagram-conversation.mapper';

@Injectable()
export class InstagramConversationRelationalRepository implements InstagramConversationRepository {
  constructor(
    @InjectRepository(InstagramConversationEntity)
    private readonly repo: Repository<InstagramConversationEntity>,
  ) {}

  async create(data: InstagramConversation): Promise<InstagramConversation> {
    const persistenceModel = InstagramConversationMapper.toPersistence(data);
    const newEntity = await this.repo.save(this.repo.create(persistenceModel));
    return InstagramConversationMapper.toDomain(newEntity);
  }

  async findById(
    id: InstagramConversation['id'],
  ): Promise<NullableType<InstagramConversation>> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? InstagramConversationMapper.toDomain(entity) : null;
  }

  async findByConnectionAndUser(
    connectionId: number,
    igUserId: string,
  ): Promise<NullableType<InstagramConversation>> {
    const entity = await this.repo.findOne({
      where: { connectionId, igUserId },
    });
    return entity ? InstagramConversationMapper.toDomain(entity) : null;
  }

  async findByConnectionIds(
    connectionIds: number[],
  ): Promise<InstagramConversation[]> {
    if (connectionIds.length === 0) return [];
    const entities = await this.repo.find({
      where: { connectionId: In(connectionIds) },
      order: { lastMessageAt: 'DESC' },
    });
    return entities.map((e) => InstagramConversationMapper.toDomain(e));
  }

  async findMissingProfile(): Promise<InstagramConversation[]> {
    const entities = await this.repo.find({
      where: { peerUsername: IsNull() },
    });
    return entities.map((e) => InstagramConversationMapper.toDomain(e));
  }

  async update(
    id: InstagramConversation['id'],
    payload: Partial<InstagramConversation>,
  ): Promise<InstagramConversation> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      throw new Error('Record not found');
    }
    const updatedEntity = await this.repo.save(
      this.repo.create(
        InstagramConversationMapper.toPersistence({
          ...InstagramConversationMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );
    return InstagramConversationMapper.toDomain(updatedEntity);
  }
}
