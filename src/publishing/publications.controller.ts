import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiHeader, ApiParam, ApiTags } from '@nestjs/swagger';
import { BrandGuard } from '../brands/guards/brand.guard';
import { CurrentBrand } from '../brands/decorators/current-brand.decorator';
import { Brand } from '../brands/domain/brand';
import { PublicationsService } from './publications.service';

@ApiTags('Publishing')
@ApiBearerAuth()
@ApiHeader({ name: 'x-brand-id', required: true })
@UseGuards(AuthGuard('jwt'), BrandGuard)
@Controller({ path: 'publishing/calendar', version: '1' })
export class PublicationsController {
  constructor(private readonly publications: PublicationsService) {}

  // Publish a calendar item now to its selected networks. Scheduled
  // auto-publishing (a worker cron) reuses the same service.
  @Post(':itemId/publish')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiParam({ name: 'itemId', type: Number })
  publish(
    @CurrentBrand() brand: Brand,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.publications.publishCalendarItem(itemId, brand.id);
  }
}
