import {
  // common
  Injectable,
} from '@nestjs/common';
import { CreateConversationStateDto } from './dto/create-conversation-state.dto';
import { UpdateConversationStateDto } from './dto/update-conversation-state.dto';
import { ConversationStateRepository } from './infrastructure/persistence/conversation-state.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { ConversationState } from './domain/conversation-state';

@Injectable()
export class ConversationStatesService {
  constructor(
    // Dependencies here
    private readonly conversationStateRepository: ConversationStateRepository,
  ) {}

  async create(createConversationStateDto: CreateConversationStateDto) {
    // Do not remove comment below.
    // <creating-property />

    return this.conversationStateRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
      resolvedByUserId: createConversationStateDto.resolvedByUserId,

      resolvedAt: createConversationStateDto.resolvedAt,

      firstResponseAt: createConversationStateDto.firstResponseAt,

      firstInboundAt: createConversationStateDto.firstInboundAt,

      status: createConversationStateDto.status,

      brandId: createConversationStateDto.brandId,

      channel: createConversationStateDto.channel,

      conversationId: createConversationStateDto.conversationId,
    });
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.conversationStateRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: ConversationState['id']) {
    return this.conversationStateRepository.findById(id);
  }

  findByIds(ids: ConversationState['id'][]) {
    return this.conversationStateRepository.findByIds(ids);
  }

  async update(
    id: ConversationState['id'],

    updateConversationStateDto: UpdateConversationStateDto,
  ) {
    // Do not remove comment below.
    // <updating-property />

    return this.conversationStateRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      resolvedByUserId: updateConversationStateDto.resolvedByUserId,

      resolvedAt: updateConversationStateDto.resolvedAt,

      firstResponseAt: updateConversationStateDto.firstResponseAt,

      firstInboundAt: updateConversationStateDto.firstInboundAt,

      status: updateConversationStateDto.status,

      brandId: updateConversationStateDto.brandId,

      channel: updateConversationStateDto.channel,

      conversationId: updateConversationStateDto.conversationId,
    });
  }

  remove(id: ConversationState['id']) {
    return this.conversationStateRepository.remove(id);
  }
}
