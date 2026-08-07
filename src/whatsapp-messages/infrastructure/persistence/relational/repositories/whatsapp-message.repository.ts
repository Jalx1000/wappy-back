import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { WhatsappMessageEntity } from '../entities/whatsapp-message.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { WhatsappMessage } from '../../../../domain/whatsapp-message';
import { WhatsappMessageRepository } from '../../whatsapp-message.repository';
import { WhatsappMessageMapper } from '../mappers/whatsapp-message.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class WhatsappMessageRelationalRepository implements WhatsappMessageRepository {
  constructor(
    @InjectRepository(WhatsappMessageEntity)
    private readonly whatsappMessageRepository: Repository<WhatsappMessageEntity>,
  ) {}

  async create(data: WhatsappMessage): Promise<WhatsappMessage> {
    const persistenceModel = WhatsappMessageMapper.toPersistence(data);
    const newEntity = await this.whatsappMessageRepository.save(
      this.whatsappMessageRepository.create(persistenceModel),
    );
    return WhatsappMessageMapper.toDomain(newEntity);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<WhatsappMessage[]> {
    const entities = await this.whatsappMessageRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });

    return entities.map((entity) => WhatsappMessageMapper.toDomain(entity));
  }

  async findById(
    id: WhatsappMessage['id'],
  ): Promise<NullableType<WhatsappMessage>> {
    const entity = await this.whatsappMessageRepository.findOne({
      where: { id },
    });

    return entity ? WhatsappMessageMapper.toDomain(entity) : null;
  }

  async findByIds(ids: WhatsappMessage['id'][]): Promise<WhatsappMessage[]> {
    const entities = await this.whatsappMessageRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => WhatsappMessageMapper.toDomain(entity));
  }

  async findByConnectionAndExternalId(
    connectionId: number,
    externalId: string,
  ): Promise<NullableType<WhatsappMessage>> {
    const entity = await this.whatsappMessageRepository.findOne({
      where: { connectionId, externalId },
    });

    return entity ? WhatsappMessageMapper.toDomain(entity) : null;
  }

  async findByConversationId(
    conversationId: string,
  ): Promise<WhatsappMessage[]> {
    const entities = await this.whatsappMessageRepository.find({
      where: { conversationId },
      order: { sentAt: 'ASC' },
    });

    return entities.map((entity) => WhatsappMessageMapper.toDomain(entity));
  }

  async update(
    id: WhatsappMessage['id'],
    payload: Partial<WhatsappMessage>,
  ): Promise<WhatsappMessage> {
    const entity = await this.whatsappMessageRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Record not found');
    }

    const updatedEntity = await this.whatsappMessageRepository.save(
      this.whatsappMessageRepository.create(
        WhatsappMessageMapper.toPersistence({
          ...WhatsappMessageMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return WhatsappMessageMapper.toDomain(updatedEntity);
  }

  async remove(id: WhatsappMessage['id']): Promise<void> {
    await this.whatsappMessageRepository.delete(id);
  }
}
