import {
  // common
  Injectable,
} from '@nestjs/common';
import { CreateConversationAssignmentDto } from './dto/create-conversation-assignment.dto';
import { UpdateConversationAssignmentDto } from './dto/update-conversation-assignment.dto';
import { ConversationAssignmentRepository } from './infrastructure/persistence/conversation-assignment.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { ConversationAssignment } from './domain/conversation-assignment';

@Injectable()
export class ConversationAssignmentsService {
  constructor(
    // Dependencies here
    private readonly conversationAssignmentRepository: ConversationAssignmentRepository,
  ) {}

  async create(
    createConversationAssignmentDto: CreateConversationAssignmentDto,
  ) {
    // Do not remove comment below.
    // <creating-property />

    return this.conversationAssignmentRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
      assignedTeamId: createConversationAssignmentDto.assignedTeamId,

      assignedUserId: createConversationAssignmentDto.assignedUserId,

      brandId: createConversationAssignmentDto.brandId,

      channel: createConversationAssignmentDto.channel,

      conversationId: createConversationAssignmentDto.conversationId,
    });
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.conversationAssignmentRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: ConversationAssignment['id']) {
    return this.conversationAssignmentRepository.findById(id);
  }

  findByIds(ids: ConversationAssignment['id'][]) {
    return this.conversationAssignmentRepository.findByIds(ids);
  }

  async update(
    id: ConversationAssignment['id'],

    updateConversationAssignmentDto: UpdateConversationAssignmentDto,
  ) {
    // Do not remove comment below.
    // <updating-property />

    return this.conversationAssignmentRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      assignedTeamId: updateConversationAssignmentDto.assignedTeamId,

      assignedUserId: updateConversationAssignmentDto.assignedUserId,

      brandId: updateConversationAssignmentDto.brandId,

      channel: updateConversationAssignmentDto.channel,

      conversationId: updateConversationAssignmentDto.conversationId,
    });
  }

  remove(id: ConversationAssignment['id']) {
    return this.conversationAssignmentRepository.remove(id);
  }
}
