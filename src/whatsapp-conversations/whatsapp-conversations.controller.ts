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
import { WhatsappConversationsService } from './whatsapp-conversations.service';
import { CreateWhatsappConversationDto } from './dto/create-whatsapp-conversation.dto';
import { UpdateWhatsappConversationDto } from './dto/update-whatsapp-conversation.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { WhatsappConversation } from './domain/whatsapp-conversation';
import { AuthGuard } from '@nestjs/passport';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { FindAllWhatsappConversationsDto } from './dto/find-all-whatsapp-conversations.dto';

@ApiTags('Whatsappconversations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'whatsapp-conversations',
  version: '1',
})
export class WhatsappConversationsController {
  constructor(
    private readonly whatsappConversationsService: WhatsappConversationsService,
  ) {}

  @Post()
  @ApiCreatedResponse({
    type: WhatsappConversation,
  })
  create(@Body() createWhatsappConversationDto: CreateWhatsappConversationDto) {
    return this.whatsappConversationsService.create(
      createWhatsappConversationDto,
    );
  }

  @Get()
  @ApiOkResponse({
    type: InfinityPaginationResponse(WhatsappConversation),
  })
  async findAll(
    @Query() query: FindAllWhatsappConversationsDto,
  ): Promise<InfinityPaginationResponseDto<WhatsappConversation>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.whatsappConversationsService.findAllWithPagination({
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
    type: WhatsappConversation,
  })
  findById(@Param('id') id: string) {
    return this.whatsappConversationsService.findById(id);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: WhatsappConversation,
  })
  update(
    @Param('id') id: string,
    @Body() updateWhatsappConversationDto: UpdateWhatsappConversationDto,
  ) {
    return this.whatsappConversationsService.update(
      id,
      updateWhatsappConversationDto,
    );
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  remove(@Param('id') id: string) {
    return this.whatsappConversationsService.remove(id);
  }
}
