import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { BrandGuard } from '../brands/guards/brand.guard';
import { CurrentBrand } from '../brands/decorators/current-brand.decorator';
import { Brand } from '../brands/domain/brand';
import { WhatsappCloudService } from './whatsapp-cloud.service';
import { ConnectWhatsappCloudDto } from './dto/connect-whatsapp-cloud.dto';
import { OnboardCoexistenceDto } from './dto/onboard-coexistence.dto';

@ApiTags('Connections')
@ApiBearerAuth()
@ApiHeader({ name: 'x-brand-id', required: true })
@UseGuards(AuthGuard('jwt'), BrandGuard)
@Controller({ path: 'connections/whatsapp', version: '1' })
export class WhatsappCloudController {
  constructor(private readonly service: WhatsappCloudService) {}

  @Post('cloud-api')
  @HttpCode(HttpStatus.CREATED)
  connect(@CurrentBrand() brand: Brand, @Body() dto: ConnectWhatsappCloudDto) {
    return this.service.connect(brand.id, dto);
  }

  @Post('coexistence')
  @HttpCode(HttpStatus.CREATED)
  coexistence(
    @CurrentBrand() brand: Brand,
    @Body() dto: OnboardCoexistenceDto,
  ) {
    return this.service.onboardCoexistence(brand.id, dto);
  }
}
