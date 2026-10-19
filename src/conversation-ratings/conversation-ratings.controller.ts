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
import { ConversationRatingsService } from './conversation-ratings.service';
import { CreateConversationRatingDto } from './dto/create-conversation-rating.dto';
import { UpdateConversationRatingDto } from './dto/update-conversation-rating.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ConversationRating } from './domain/conversation-rating';
import { AuthGuard } from '@nestjs/passport';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { FindAllConversationRatingsDto } from './dto/find-all-conversation-ratings.dto';

@ApiTags('Conversationratings')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'conversation-ratings',
  version: '1',
})
export class ConversationRatingsController {
  constructor(
    private readonly conversationRatingsService: ConversationRatingsService,
  ) {}

  @Post()
  @ApiCreatedResponse({
    type: ConversationRating,
  })
  create(@Body() createConversationRatingDto: CreateConversationRatingDto) {
    return this.conversationRatingsService.create(createConversationRatingDto);
  }

  @Get()
  @ApiOkResponse({
    type: InfinityPaginationResponse(ConversationRating),
  })
  async findAll(
    @Query() query: FindAllConversationRatingsDto,
  ): Promise<InfinityPaginationResponseDto<ConversationRating>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.conversationRatingsService.findAllWithPagination({
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
    type: ConversationRating,
  })
  findById(@Param('id') id: string) {
    return this.conversationRatingsService.findById(id);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: ConversationRating,
  })
  update(
    @Param('id') id: string,
    @Body() updateConversationRatingDto: UpdateConversationRatingDto,
  ) {
    return this.conversationRatingsService.update(
      id,
      updateConversationRatingDto,
    );
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  remove(@Param('id') id: string) {
    return this.conversationRatingsService.remove(id);
  }
}
