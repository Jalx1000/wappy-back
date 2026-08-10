import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ConversationAssignmentsService } from './conversation-assignments.service';
import { CreateConversationAssignmentDto } from './dto/create-conversation-assignment.dto';
import { UpdateConversationAssignmentDto } from './dto/update-conversation-assignment.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ConversationAssignment } from './domain/conversation-assignment';
import { AuthGuard } from '@nestjs/passport';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { FindAllConversationAssignmentsDto } from './dto/find-all-conversation-assignments.dto';

@ApiTags('Conversationassignments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'conversation-assignments',
  version: '1',
})
export class ConversationAssignmentsController {
  constructor(
    private readonly conversationAssignmentsService: ConversationAssignmentsService,
  ) {}

  @Post()
  @ApiCreatedResponse({
    type: ConversationAssignment,
  })
  create(
    @Body() createConversationAssignmentDto: CreateConversationAssignmentDto,
  ) {
    return this.conversationAssignmentsService.create(
      createConversationAssignmentDto,
    );
  }

  @Get()
  @ApiOkResponse({
    type: InfinityPaginationResponse(ConversationAssignment),
  })
  async findAll(
    @Query() query: FindAllConversationAssignmentsDto,
  ): Promise<InfinityPaginationResponseDto<ConversationAssignment>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.conversationAssignmentsService.findAllWithPagination({
        paginationOptions: {
          page,
          limit,
        },
      }),
      { page, limit },
    );
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: ConversationAssignment,
  })
  findById(@Param('id') id: string) {
    return this.conversationAssignmentsService.findById(id);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: ConversationAssignment,
  })
  update(
    @Param('id') id: string,
    @Body() updateConversationAssignmentDto: UpdateConversationAssignmentDto,
  ) {
    return this.conversationAssignmentsService.update(
      id,
      updateConversationAssignmentDto,
    );
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  remove(@Param('id') id: string) {
    return this.conversationAssignmentsService.remove(id);
  }
}
