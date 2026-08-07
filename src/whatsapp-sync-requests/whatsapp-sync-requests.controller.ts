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
import { WhatsappSyncRequestsService } from './whatsapp-sync-requests.service';
import { CreateWhatsappSyncRequestDto } from './dto/create-whatsapp-sync-request.dto';
import { UpdateWhatsappSyncRequestDto } from './dto/update-whatsapp-sync-request.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { WhatsappSyncRequest } from './domain/whatsapp-sync-request';
import { AuthGuard } from '@nestjs/passport';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { FindAllWhatsappSyncRequestsDto } from './dto/find-all-whatsapp-sync-requests.dto';

@ApiTags('Whatsappsyncrequests')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'whatsapp-sync-requests',
  version: '1',
})
export class WhatsappSyncRequestsController {
  constructor(
    private readonly whatsappSyncRequestsService: WhatsappSyncRequestsService,
  ) {}

  @Post()
  @ApiCreatedResponse({
    type: WhatsappSyncRequest,
  })
  create(@Body() createWhatsappSyncRequestDto: CreateWhatsappSyncRequestDto) {
    return this.whatsappSyncRequestsService.create(
      createWhatsappSyncRequestDto,
    );
  }

  @Get()
  @ApiOkResponse({
    type: InfinityPaginationResponse(WhatsappSyncRequest),
  })
  async findAll(
    @Query() query: FindAllWhatsappSyncRequestsDto,
  ): Promise<InfinityPaginationResponseDto<WhatsappSyncRequest>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.whatsappSyncRequestsService.findAllWithPagination({
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
    type: WhatsappSyncRequest,
  })
  findById(@Param('id') id: string) {
    return this.whatsappSyncRequestsService.findById(id);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: WhatsappSyncRequest,
  })
  update(
    @Param('id') id: string,
    @Body() updateWhatsappSyncRequestDto: UpdateWhatsappSyncRequestDto,
  ) {
    return this.whatsappSyncRequestsService.update(
      id,
      updateWhatsappSyncRequestDto,
    );
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  remove(@Param('id') id: string) {
    return this.whatsappSyncRequestsService.remove(id);
  }
}
