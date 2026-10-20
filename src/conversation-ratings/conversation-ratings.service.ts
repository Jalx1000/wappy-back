import {
  // common
  Injectable,
} from '@nestjs/common';
import { CreateConversationRatingDto } from './dto/create-conversation-rating.dto';
import { UpdateConversationRatingDto } from './dto/update-conversation-rating.dto';
import { ConversationRatingRepository } from './infrastructure/persistence/conversation-rating.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { ConversationRating } from './domain/conversation-rating';

@Injectable()
export class ConversationRatingsService {
  constructor(
    // Dependencies here
    private readonly conversationRatingRepository: ConversationRatingRepository,
  ) {}

  async create(createConversationRatingDto: CreateConversationRatingDto) {
    // Do not remove comment below.
    // <creating-property />

    return this.conversationRatingRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
      agentUserId: createConversationRatingDto.agentUserId,

      comment: createConversationRatingDto.comment,

      brandId: createConversationRatingDto.brandId,

      conversationId: createConversationRatingDto.conversationId,

      channel: createConversationRatingDto.channel,

      score: createConversationRatingDto.score,
    });
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.conversationRatingRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: ConversationRating['id']) {
    return this.conversationRatingRepository.findById(id);
  }

  findByIds(ids: ConversationRating['id'][]) {
    return this.conversationRatingRepository.findByIds(ids);
  }

  /** CSAT aggregate (count, average, score distribution) for a brand. */
  async aggregateCsat(
    brandId: number,
    range?: { from?: Date; to?: Date },
  ): Promise<{
    count: number;
    average: number | null;
    distribution: Record<string, number>;
  }> {
    const ratings = await this.conversationRatingRepository.findByBrand(
      brandId,
      range,
    );
    const distribution: Record<string, number> = {};
    let sum = 0;
    for (const r of ratings) {
      const key = String(r.score);
      distribution[key] = (distribution[key] ?? 0) + 1;
      sum += r.score;
    }
    const count = ratings.length;
    const average = count > 0 ? Math.round((sum / count) * 100) / 100 : null;
    return { count, average, distribution };
  }

  async update(
    id: ConversationRating['id'],

    updateConversationRatingDto: UpdateConversationRatingDto,
  ) {
    // Do not remove comment below.
    // <updating-property />

    return this.conversationRatingRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      agentUserId: updateConversationRatingDto.agentUserId,

      comment: updateConversationRatingDto.comment,

      brandId: updateConversationRatingDto.brandId,

      conversationId: updateConversationRatingDto.conversationId,

      channel: updateConversationRatingDto.channel,

      score: updateConversationRatingDto.score,
    });
  }

  remove(id: ConversationRating['id']) {
    return this.conversationRatingRepository.remove(id);
  }
}
