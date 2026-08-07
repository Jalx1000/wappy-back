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
import { WhatsappMessagesService } from './whatsapp-messages.service';
import { CreateWhatsappMessageDto } from './dto/create-whatsapp-message.dto';
import { UpdateWhatsappMessageDto } from './dto/update-whatsapp-message.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { WhatsappMessage } from './domain/whatsapp-message';
import { AuthGuard } from '@nestjs/passport';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { FindAllWhatsappMessagesDto } from './dto/find-all-whatsapp-messages.dto';

@ApiTags('Whatsappmessages')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'whatsapp-messages',
  version: '1',
})
export class WhatsappMessagesController {
  constructor(
    private readonly whatsappMessagesService: WhatsappMessagesService,
  ) {}

  @Post()
  @ApiCreatedResponse({
    type: WhatsappMessage,
  })
  create(@Body() createWhatsappMessageDto: CreateWhatsappMessageDto) {
    return this.whatsappMessagesService.create(createWhatsappMessageDto);
  }

  @Get()
  @ApiOkResponse({
    type: InfinityPaginationResponse(WhatsappMessage),
  })
  async findAll(
    @Query() query: FindAllWhatsappMessagesDto,
  ): Promise<InfinityPaginationResponseDto<WhatsappMessage>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.whatsappMessagesService.findAllWithPagination({
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
    type: WhatsappMessage,
  })
  findById(@Param('id') id: string) {
    return this.whatsappMessagesService.findById(id);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: WhatsappMessage,
  })
  update(
    @Param('id') id: string,
    @Body() updateWhatsappMessageDto: UpdateWhatsappMessageDto,
  ) {
    return this.whatsappMessagesService.update(id, updateWhatsappMessageDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  remove(@Param('id') id: string) {
    return this.whatsappMessagesService.remove(id);
  }
}
