import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';

// Cross-brand summary for the Marcas grid. Unlike AnalyticsController this is
// not scoped to one brand, so no BrandGuard / x-brand-id here.
@ApiTags('Brands')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'brands-overview', version: '1' })
export class BrandsOverviewController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  getOverview() {
    return this.analyticsService.getBrandsOverview();
  }
}
