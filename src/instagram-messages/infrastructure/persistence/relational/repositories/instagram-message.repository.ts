import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstagramMessageEntity } from '../entities/instagram-message.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { InstagramMessage } from '../../../../domain/instagram-message';
import { InstagramMessageRepository } from '../../instagram-message.repository';
import { InstagramMessageMapper } from '../mappers/instagram-message.mapper';

@Injectable()
export class InstagramMessageRelationalRepository implements InstagramMessageRepository {
  constructor(
    @InjectRepository(InstagramMessageEntity)
    private readonly repo: Repository<InstagramMessageEntity>,
  ) {}

  async create(data: InstagramMessage): Promise<InstagramMessage> {
    const persistenceModel = InstagramMessageMapper.toPersistence(data);
    const newEntity = await this.repo.save(this.repo.create(persistenceModel));
    return InstagramMessageMapper.toDomain(newEntity);
  }

  async findByConnectionAndExternalId(
    connectionId: number,
    externalId: string,
  ): Promise<NullableType<InstagramMessage>> {
    const entity = await this.repo.findOne({
      where: { connectionId, externalId },
    });
    return entity ? InstagramMessageMapper.toDomain(entity) : null;
  }

  async findByConversationId(
    conversationId: string,
  ): Promise<InstagramMessage[]> {
    const entities = await this.repo.find({
      where: { conversationId },
      order: { sentAt: 'ASC' },
    });
    return entities.map((e) => InstagramMessageMapper.toDomain(e));
  }

  async update(
    id: InstagramMessage['id'],
    payload: Partial<InstagramMessage>,
  ): Promise<InstagramMessage> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      throw new Error('Record not found');
    }
    const updatedEntity = await this.repo.save(
      this.repo.create(
        InstagramMessageMapper.toPersistence({
          ...InstagramMessageMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );
    return InstagramMessageMapper.toDomain(updatedEntity);
  }
}
