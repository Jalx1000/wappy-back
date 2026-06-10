import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
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
import { Brand } from '../brands/domain/brand';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@ApiHeader({ name: 'x-brand-id', required: true })
@UseGuards(AuthGuard('jwt'), BrandGuard)
@Controller({ path: 'reports', version: '1' })
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentBrand() brand: Brand, @Body() dto: CreateReportDto) {
    return this.reportsService.create(brand.id, dto);
  }

  @Get()
  findAll(@CurrentBrand() brand: Brand) {
    return this.reportsService.findAllForBrand(brand.id);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  findOne(
    @CurrentBrand() brand: Brand,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reportsService.findOne(brand.id, id);
  }
}
