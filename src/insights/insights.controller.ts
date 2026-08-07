import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BrandGuard } from '../brands/guards/brand.guard';
import { CurrentBrand } from '../brands/decorators/current-brand.decorator';
import { Brand } from '../brands/domain/brand';
import { InsightsService } from './insights.service';
import { CreateInsightDto } from './dto/create-insight.dto';

@ApiTags('Insights')
@ApiBearerAuth()
@ApiHeader({ name: 'x-brand-id', required: true })
@UseGuards(AuthGuard('jwt'), BrandGuard)
@Controller({ path: 'insights', version: '1' })
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  generate(@CurrentBrand() brand: Brand, @Body() dto: CreateInsightDto) {
    return this.insightsService.generate(brand.id, dto);
  }

  @Get()
  findAll(@CurrentBrand() brand: Brand) {
    return this.insightsService.findAllForBrand(brand.id);
  }
}
