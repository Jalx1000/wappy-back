import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ApiKeyEntity } from '../entities/api-key.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { ApiKey } from '../../../../domain/api-key';
import { ApiKeyRepository } from '../../api-key.repository';
import { ApiKeyMapper } from '../mappers/api-key.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class ApiKeyRelationalRepository implements ApiKeyRepository {
  constructor(
    @InjectRepository(ApiKeyEntity)
    private readonly apiKeyRepository: Repository<ApiKeyEntity>,
  ) {}

  async create(data: ApiKey): Promise<ApiKey> {
    const persistenceModel = ApiKeyMapper.toPersistence(data);
    const newEntity = await this.apiKeyRepository.save(
      this.apiKeyRepository.create(persistenceModel),
    );
    return ApiKeyMapper.toDomain(newEntity);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<ApiKey[]> {
    const entities = await this.apiKeyRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });

    return entities.map((entity) => ApiKeyMapper.toDomain(entity));
  }

  async findById(id: ApiKey['id']): Promise<NullableType<ApiKey>> {
    const entity = await this.apiKeyRepository.findOne({
      where: { id },
    });

    return entity ? ApiKeyMapper.toDomain(entity) : null;
  }

  async findByIds(ids: ApiKey['id'][]): Promise<ApiKey[]> {
    const entities = await this.apiKeyRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => ApiKeyMapper.toDomain(entity));
  }

  async findByHash(keyHash: string): Promise<NullableType<ApiKey>> {
    const entity = await this.apiKeyRepository.findOne({ where: { keyHash } });
    return entity ? ApiKeyMapper.toDomain(entity) : null;
  }

  async findByBrand(brandId: number): Promise<ApiKey[]> {
    const entities = await this.apiKeyRepository.find({
      where: { brandId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => ApiKeyMapper.toDomain(entity));
  }

  async update(id: ApiKey['id'], payload: Partial<ApiKey>): Promise<ApiKey> {
    const entity = await this.apiKeyRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Record not found');
    }

    const updatedEntity = await this.apiKeyRepository.save(
      this.apiKeyRepository.create(
        ApiKeyMapper.toPersistence({
          ...ApiKeyMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return ApiKeyMapper.toDomain(updatedEntity);
  }

  async remove(id: ApiKey['id']): Promise<void> {
    await this.apiKeyRepository.delete(id);
  }
}
