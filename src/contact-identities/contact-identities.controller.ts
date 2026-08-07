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
import { ContactIdentitiesService } from './contact-identities.service';
import { CreateContactIdentityDto } from './dto/create-contact-identity.dto';
import { UpdateContactIdentityDto } from './dto/update-contact-identity.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ContactIdentity } from './domain/contact-identity';
import { AuthGuard } from '@nestjs/passport';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { FindAllContactIdentitiesDto } from './dto/find-all-contact-identities.dto';

@ApiTags('Contactidentities')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'contact-identities',
  version: '1',
})
export class ContactIdentitiesController {
  constructor(
    private readonly contactIdentitiesService: ContactIdentitiesService,
  ) {}

  @Post()
  @ApiCreatedResponse({
    type: ContactIdentity,
  })
  create(@Body() createContactIdentityDto: CreateContactIdentityDto) {
    return this.contactIdentitiesService.create(createContactIdentityDto);
  }

  @Get()
  @ApiOkResponse({
    type: InfinityPaginationResponse(ContactIdentity),
  })
  async findAll(
    @Query() query: FindAllContactIdentitiesDto,
  ): Promise<InfinityPaginationResponseDto<ContactIdentity>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.contactIdentitiesService.findAllWithPagination({
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
    type: ContactIdentity,
  })
  findById(@Param('id') id: string) {
    return this.contactIdentitiesService.findById(id);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: ContactIdentity,
  })
  update(
    @Param('id') id: string,
    @Body() updateContactIdentityDto: UpdateContactIdentityDto,
  ) {
    return this.contactIdentitiesService.update(id, updateContactIdentityDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  remove(@Param('id') id: string) {
    return this.contactIdentitiesService.remove(id);
  }
}
