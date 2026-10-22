import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { WebhookEndpointEntity } from '../entities/webhook-endpoint.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { WebhookEndpoint } from '../../../../domain/webhook-endpoint';
import { WebhookEndpointRepository } from '../../webhook-endpoint.repository';
import { WebhookEndpointMapper } from '../mappers/webhook-endpoint.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class WebhookEndpointRelationalRepository implements WebhookEndpointRepository {
  constructor(
    @InjectRepository(WebhookEndpointEntity)
    private readonly webhookEndpointRepository: Repository<WebhookEndpointEntity>,
  ) {}

  async create(data: WebhookEndpoint): Promise<WebhookEndpoint> {
    const persistenceModel = WebhookEndpointMapper.toPersistence(data);
    const newEntity = await this.webhookEndpointRepository.save(
      this.webhookEndpointRepository.create(persistenceModel),
    );
    return WebhookEndpointMapper.toDomain(newEntity);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<WebhookEndpoint[]> {
    const entities = await this.webhookEndpointRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });

    return entities.map((entity) => WebhookEndpointMapper.toDomain(entity));
  }

  async findById(
    id: WebhookEndpoint['id'],
  ): Promise<NullableType<WebhookEndpoint>> {
    const entity = await this.webhookEndpointRepository.findOne({
      where: { id },
    });

    return entity ? WebhookEndpointMapper.toDomain(entity) : null;
  }

  async findByIds(ids: WebhookEndpoint['id'][]): Promise<WebhookEndpoint[]> {
    const entities = await this.webhookEndpointRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => WebhookEndpointMapper.toDomain(entity));
  }

  async findActiveByBrand(brandId: number): Promise<WebhookEndpoint[]> {
    const entities = await this.webhookEndpointRepository.find({
      where: { brandId, active: true },
    });
    return entities.map((entity) => WebhookEndpointMapper.toDomain(entity));
  }

  async update(
    id: WebhookEndpoint['id'],
    payload: Partial<WebhookEndpoint>,
  ): Promise<WebhookEndpoint> {
    const entity = await this.webhookEndpointRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Record not found');
    }

    const updatedEntity = await this.webhookEndpointRepository.save(
      this.webhookEndpointRepository.create(
        WebhookEndpointMapper.toPersistence({
          ...WebhookEndpointMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return WebhookEndpointMapper.toDomain(updatedEntity);
  }

  async remove(id: WebhookEndpoint['id']): Promise<void> {
    await this.webhookEndpointRepository.delete(id);
  }
}
