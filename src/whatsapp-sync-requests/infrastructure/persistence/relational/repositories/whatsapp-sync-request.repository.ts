import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { WhatsappSyncRequestEntity } from '../entities/whatsapp-sync-request.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { WhatsappSyncRequest } from '../../../../domain/whatsapp-sync-request';
import { WhatsappSyncRequestRepository } from '../../whatsapp-sync-request.repository';
import { WhatsappSyncRequestMapper } from '../mappers/whatsapp-sync-request.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class WhatsappSyncRequestRelationalRepository implements WhatsappSyncRequestRepository {
  constructor(
    @InjectRepository(WhatsappSyncRequestEntity)
    private readonly whatsappSyncRequestRepository: Repository<WhatsappSyncRequestEntity>,
  ) {}

  async create(data: WhatsappSyncRequest): Promise<WhatsappSyncRequest> {
    const persistenceModel = WhatsappSyncRequestMapper.toPersistence(data);
    const newEntity = await this.whatsappSyncRequestRepository.save(
      this.whatsappSyncRequestRepository.create(persistenceModel),
    );
    return WhatsappSyncRequestMapper.toDomain(newEntity);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<WhatsappSyncRequest[]> {
    const entities = await this.whatsappSyncRequestRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });

    return entities.map((entity) => WhatsappSyncRequestMapper.toDomain(entity));
  }

  async findById(
    id: WhatsappSyncRequest['id'],
  ): Promise<NullableType<WhatsappSyncRequest>> {
    const entity = await this.whatsappSyncRequestRepository.findOne({
      where: { id },
    });

    return entity ? WhatsappSyncRequestMapper.toDomain(entity) : null;
  }

  async findByIds(
    ids: WhatsappSyncRequest['id'][],
  ): Promise<WhatsappSyncRequest[]> {
    const entities = await this.whatsappSyncRequestRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => WhatsappSyncRequestMapper.toDomain(entity));
  }

  async update(
    id: WhatsappSyncRequest['id'],
    payload: Partial<WhatsappSyncRequest>,
  ): Promise<WhatsappSyncRequest> {
    const entity = await this.whatsappSyncRequestRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Record not found');
    }

    const updatedEntity = await this.whatsappSyncRequestRepository.save(
      this.whatsappSyncRequestRepository.create(
        WhatsappSyncRequestMapper.toPersistence({
          ...WhatsappSyncRequestMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return WhatsappSyncRequestMapper.toDomain(updatedEntity);
  }

  async remove(id: WhatsappSyncRequest['id']): Promise<void> {
    await this.whatsappSyncRequestRepository.delete(id);
  }
}
