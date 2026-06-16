import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BrandGuard } from '../brands/guards/brand.guard';
import { CurrentBrand } from '../brands/decorators/current-brand.decorator';
import { Brand } from '../brands/domain/brand';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@ApiHeader({ name: 'x-brand-id', required: true })
@UseGuards(AuthGuard('jwt'), BrandGuard)
@Controller({ path: 'analytics', version: '1' })
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('social/overview')
  @ApiQuery({ name: 'connectionId', type: Number })
  @ApiQuery({ name: 'from', type: String, example: '2025-01-01' })
  @ApiQuery({ name: 'to', type: String, example: '2025-03-31' })
  getSocialOverview(
    @CurrentBrand() brand: Brand,
    @Query('connectionId', ParseIntPipe) connectionId: number,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.analyticsService.getSocialOverview(
      brand.id,
      connectionId,
      new Date(from),
      new Date(to),
    );
  }

  @Get('social/top-posts')
  @ApiQuery({ name: 'connectionId', type: Number })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  getTopPosts(
    @CurrentBrand() brand: Brand,
    @Query('connectionId', ParseIntPipe) connectionId: number,
    @Query('limit') limit?: string,
  ) {
    return this.analyticsService.getTopPosts(
      brand.id,
      connectionId,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('social/summary')
  @ApiQuery({ name: 'from', type: String, example: '2025-01-01' })
  @ApiQuery({ name: 'to', type: String, example: '2025-03-31' })
  getSocialSummary(
    @CurrentBrand() brand: Brand,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.analyticsService.getSocialSummary(
      brand.id,
      new Date(from),
      new Date(to),
    );
  }

  @Get('ads/overview')
  @ApiQuery({ name: 'from', type: String, example: '2025-01-01' })
  @ApiQuery({ name: 'to', type: String, example: '2025-03-31' })
  @ApiQuery({ name: 'compare', type: Boolean, required: false })
  getAdsOverview(
    @CurrentBrand() brand: Brand,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('compare') compare?: string,
  ) {
    return this.analyticsService.getAdsOverview(
      brand.id,
      new Date(from),
      new Date(to),
      compare === 'true',
    );
  }

  @Get('ads/campaigns')
  @ApiQuery({ name: 'from', type: String, example: '2025-01-01' })
  @ApiQuery({ name: 'to', type: String, example: '2025-03-31' })
  getAdsCampaigns(
    @CurrentBrand() brand: Brand,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.analyticsService.getAdsCampaigns(
      brand.id,
      new Date(from),
      new Date(to),
    );
  }

  @Get('web/overview')
  @ApiQuery({ name: 'from', type: String, example: '2025-01-01' })
  @ApiQuery({ name: 'to', type: String, example: '2025-03-31' })
  @ApiQuery({ name: 'city', type: String, required: false })
  @ApiQuery({ name: 'connectionId', type: Number, required: false })
  getWebOverview(
    @CurrentBrand() brand: Brand,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('city') city?: string,
    @Query('connectionId') connectionId?: string,
  ) {
    return this.analyticsService.getWebOverview(
      brand.id,
      new Date(from),
      new Date(to),
      city,
      connectionId ? parseInt(connectionId, 10) : undefined,
    );
  }

  @Get('web/cities')
  @ApiQuery({ name: 'from', type: String, example: '2025-01-01' })
  @ApiQuery({ name: 'to', type: String, example: '2025-03-31' })
  @ApiQuery({ name: 'connectionId', type: Number, required: false })
  getWebCities(
    @CurrentBrand() brand: Brand,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('connectionId') connectionId?: string,
  ) {
    return this.analyticsService.listWebCities(
      brand.id,
      new Date(from),
      new Date(to),
      connectionId ? parseInt(connectionId, 10) : undefined,
    );
  }

  @Get('web/countries')
  @ApiQuery({ name: 'from', type: String, example: '2025-01-01' })
  @ApiQuery({ name: 'to', type: String, example: '2025-03-31' })
  @ApiQuery({ name: 'connectionId', type: Number, required: false })
  getWebCountries(
    @CurrentBrand() brand: Brand,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('connectionId') connectionId?: string,
  ) {
    return this.analyticsService.getWebCountries(
      brand.id,
      new Date(from),
      new Date(to),
      connectionId ? parseInt(connectionId, 10) : undefined,
    );
  }
}
