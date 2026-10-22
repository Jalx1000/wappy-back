import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { WebhookEndpointsService } from './webhook-endpoints.service';
import { CreateWebhookEndpointDto } from './dto/create-webhook-endpoint.dto';
import { BrandGuard } from '../brands/guards/brand.guard';
import { CurrentBrand } from '../brands/decorators/current-brand.decorator';
import { Brand } from '../brands/domain/brand';

/**
 * Admin management of a brand's outbound webhook endpoint (brief §3). JWT +
 * active brand. The signing `secret` is returned on create and listing so the
 * integrator can verify `X-Wappy-Signature`.
 */
@ApiTags('Webhook Endpoints')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), BrandGuard)
@Controller({ path: 'webhook-endpoints', version: '1' })
export class WebhookEndpointsController {
  constructor(private readonly service: WebhookEndpointsService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Returns the endpoint with its secret.' })
  async create(
    @CurrentBrand() brand: Brand,
    @Body() dto: CreateWebhookEndpointDto,
  ) {
    const endpoint = await this.service.createForBrand(brand.id, dto.url);
    return {
      id: endpoint.id,
      url: endpoint.url,
      secret: endpoint.secret,
      active: endpoint.active,
      createdAt: endpoint.createdAt,
    };
  }

  @Get()
  list(@CurrentBrand() brand: Brand) {
    return this.service.listForBrand(brand.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentBrand() brand: Brand, @Param('id') id: string) {
    return this.service.removeForBrand(brand.id, id);
  }
}
