import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessengerMessageEntity } from '../entities/messenger-message.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { MessengerMessage } from '../../../../domain/messenger-message';
import { MessengerMessageRepository } from '../../messenger-message.repository';
import { MessengerMessageMapper } from '../mappers/messenger-message.mapper';

@Injectable()
export class MessengerMessageRelationalRepository implements MessengerMessageRepository {
  constructor(
    @InjectRepository(MessengerMessageEntity)
    private readonly repo: Repository<MessengerMessageEntity>,
  ) {}

  async create(data: MessengerMessage): Promise<MessengerMessage> {
    const persistenceModel = MessengerMessageMapper.toPersistence(data);
    const newEntity = await this.repo.save(this.repo.create(persistenceModel));
    return MessengerMessageMapper.toDomain(newEntity);
  }

  async findByConnectionAndExternalId(
    connectionId: number,
    externalId: string,
  ): Promise<NullableType<MessengerMessage>> {
    const entity = await this.repo.findOne({
      where: { connectionId, externalId },
    });
    return entity ? MessengerMessageMapper.toDomain(entity) : null;
  }

  async findByConversationId(
    conversationId: string,
  ): Promise<MessengerMessage[]> {
    const entities = await this.repo.find({
      where: { conversationId },
      order: { sentAt: 'ASC' },
    });
    return entities.map((e) => MessengerMessageMapper.toDomain(e));
  }

  async update(
    id: MessengerMessage['id'],
    payload: Partial<MessengerMessage>,
  ): Promise<MessengerMessage> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      throw new Error('Record not found');
    }
    const updatedEntity = await this.repo.save(
      this.repo.create(
        MessengerMessageMapper.toPersistence({
          ...MessengerMessageMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );
    return MessengerMessageMapper.toDomain(updatedEntity);
  }
}
