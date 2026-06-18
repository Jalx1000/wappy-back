import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BrandGuard } from '../brands/guards/brand.guard';
import { CurrentBrand } from '../brands/decorators/current-brand.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { Brand } from '../brands/domain/brand';
import { ReportSchedulesService } from './report-schedules.service';
import { CreateReportScheduleDto } from './dto/create-report-schedule.dto';
import { UpdateReportScheduleDto } from './dto/update-report-schedule.dto';

@ApiTags('Report Schedules')
@ApiBearerAuth()
@ApiHeader({ name: 'x-brand-id', required: true })
@UseGuards(AuthGuard('jwt'), BrandGuard)
@Controller({ path: 'report-schedules', version: '1' })
export class ReportSchedulesController {
  constructor(private readonly service: ReportSchedulesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentBrand() brand: Brand,
    @CurrentUser() user: JwtPayloadType,
    @Body() dto: CreateReportScheduleDto,
  ) {
    return this.service.create(brand.id, Number(user.id) || null, dto);
  }

  @Get()
  findAll(@CurrentBrand() brand: Brand) {
    return this.service.findAllForBrand(brand.id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: Number })
  update(
    @CurrentBrand() brand: Brand,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReportScheduleDto,
  ) {
    return this.service.update(brand.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: Number })
  remove(
    @CurrentBrand() brand: Brand,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.remove(brand.id, id);
  }
}
