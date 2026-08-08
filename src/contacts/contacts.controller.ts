import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ContactsService } from './contacts.service';
import { UpdateContactProfileDto } from './dto/update-contact-profile.dto';
import { MergeContactDto } from './dto/merge-contact.dto';
import { FindAllContactsDto } from './dto/find-all-contacts.dto';
import { BrandGuard } from '../brands/guards/brand.guard';
import { CurrentBrand } from '../brands/decorators/current-brand.decorator';
import { Brand } from '../brands/domain/brand';
import { infinityPagination } from '../utils/infinity-pagination';

// Central, multi-channel contacts. Every endpoint is brand-scoped via the
// x-brand-id header (BrandGuard) so a brand only ever sees its own people, and
// each contact is returned together with its channel identities (WhatsApp,
// Instagram, …) — the aggregate the UI renders.
@ApiTags('Contacts')
@ApiBearerAuth()
@ApiHeader({ name: 'x-brand-id', required: true })
@UseGuards(AuthGuard('jwt'), BrandGuard)
@Controller({
  path: 'contacts',
  version: '1',
})
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @ApiOkResponse({
    description: 'Active brand contacts with their identities.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @CurrentBrand() brand: Brand,
    @Query() query: FindAllContactsDto,
  ) {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 20;
    if (limit > 50) {
      limit = 50;
    }

    const items = await this.contactsService.listForBrand(brand.id, {
      page,
      limit,
      search: query?.search,
    });

    return infinityPagination(items, { page, limit });
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String, required: true })
  findById(@CurrentBrand() brand: Brand, @Param('id') id: string) {
    return this.contactsService.getForBrand(brand.id, id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: String, required: true })
  update(
    @CurrentBrand() brand: Brand,
    @Param('id') id: string,
    @Body() dto: UpdateContactProfileDto,
  ) {
    return this.contactsService.updateProfileForBrand(brand.id, id, dto);
  }

  @Post(':id/merge')
  @ApiParam({ name: 'id', type: String, required: true })
  merge(
    @CurrentBrand() brand: Brand,
    @Param('id') survivorId: string,
    @Body() dto: MergeContactDto,
  ) {
    return this.contactsService.mergeForBrand(
      brand.id,
      survivorId,
      dto.loserId,
    );
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: String, required: true })
  async remove(
    @CurrentBrand() brand: Brand,
    @Param('id') id: string,
  ): Promise<{ id: string }> {
    await this.contactsService.removeForBrand(brand.id, id);
    return { id };
  }
}
