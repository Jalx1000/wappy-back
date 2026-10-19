import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConversationRatingEntity } from '../entities/conversation-rating.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { ConversationRating } from '../../../../domain/conversation-rating';
import { ConversationRatingRepository } from '../../conversation-rating.repository';
import { ConversationRatingMapper } from '../mappers/conversation-rating.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class ConversationRatingRelationalRepository implements ConversationRatingRepository {
  constructor(
    @InjectRepository(ConversationRatingEntity)
    private readonly conversationRatingRepository: Repository<ConversationRatingEntity>,
  ) {}

  async create(data: ConversationRating): Promise<ConversationRating> {
    const persistenceModel = ConversationRatingMapper.toPersistence(data);
    const newEntity = await this.conversationRatingRepository.save(
      this.conversationRatingRepository.create(persistenceModel),
    );
    return ConversationRatingMapper.toDomain(newEntity);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<ConversationRating[]> {
    const entities = await this.conversationRatingRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });

    return entities.map((entity) => ConversationRatingMapper.toDomain(entity));
  }

  async findById(
    id: ConversationRating['id'],
  ): Promise<NullableType<ConversationRating>> {
    const entity = await this.conversationRatingRepository.findOne({
      where: { id },
    });

    return entity ? ConversationRatingMapper.toDomain(entity) : null;
  }

  async findByIds(
    ids: ConversationRating['id'][],
  ): Promise<ConversationRating[]> {
    const entities = await this.conversationRatingRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => ConversationRatingMapper.toDomain(entity));
  }

  async update(
    id: ConversationRating['id'],
    payload: Partial<ConversationRating>,
  ): Promise<ConversationRating> {
    const entity = await this.conversationRatingRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Record not found');
    }

    const updatedEntity = await this.conversationRatingRepository.save(
      this.conversationRatingRepository.create(
        ConversationRatingMapper.toPersistence({
          ...ConversationRatingMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return ConversationRatingMapper.toDomain(updatedEntity);
  }

  async remove(id: ConversationRating['id']): Promise<void> {
    await this.conversationRatingRepository.delete(id);
  }

  async findByBrand(
    brandId: number,
    range?: { from?: Date; to?: Date },
  ): Promise<ConversationRating[]> {
    const qb = this.conversationRatingRepository
      .createQueryBuilder('r')
      .where('r.brandId = :brandId', { brandId });
    if (range?.from) qb.andWhere('r.createdAt >= :from', { from: range.from });
    if (range?.to) qb.andWhere('r.createdAt <= :to', { to: range.to });
    const entities = await qb.getMany();
    return entities.map((entity) => ConversationRatingMapper.toDomain(entity));
  }
}
