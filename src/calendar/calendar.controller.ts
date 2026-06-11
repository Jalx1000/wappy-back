import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BrandGuard } from '../brands/guards/brand.guard';
import { CurrentBrand } from '../brands/decorators/current-brand.decorator';
import { Brand } from '../brands/domain/brand';
import { CalendarService } from './calendar.service';
import { CreateCalendarItemDto } from './dto/create-calendar-item.dto';
import { UpdateCalendarItemDto } from './dto/update-calendar-item.dto';

@ApiTags('Calendar')
@ApiBearerAuth()
@ApiHeader({ name: 'x-brand-id', required: true })
@UseGuards(AuthGuard('jwt'), BrandGuard)
@Controller({ path: 'calendar', version: '1' })
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  @ApiQuery({ name: 'from', type: String, required: false })
  @ApiQuery({ name: 'to', type: String, required: false })
  async getItems(
    @CurrentBrand() brand: Brand,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    return this.calendarService.getByBrandAndDateRange(brand.id, fromDate, toDate);
  }

  @Get(':id')
  async getItem(
    @CurrentBrand() brand: Brand,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.calendarService.getById(id, brand.id);
  }

  @Post()
  async create(
    @CurrentBrand() brand: Brand,
    @Body() dto: CreateCalendarItemDto,
  ) {
    return this.calendarService.create(brand.id, dto);
  }

  @Patch(':id')
  async update(
    @CurrentBrand() brand: Brand,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCalendarItemDto,
  ) {
    return this.calendarService.update(id, brand.id, dto);
  }

  @Delete(':id')
  async delete(
    @CurrentBrand() brand: Brand,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.calendarService.delete(id, brand.id);
    return { success: true };
  }
}
