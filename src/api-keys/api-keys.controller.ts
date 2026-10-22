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
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { BrandGuard } from '../brands/guards/brand.guard';
import { CurrentBrand } from '../brands/decorators/current-brand.decorator';
import { Brand } from '../brands/domain/brand';

/**
 * Admin management of a brand's integration API keys. Guarded by JWT + the
 * active brand (x-brand-id). The plaintext key is returned ONLY on create; the
 * listing shows the masked prefix. Consumed by the "API de Wappy" panel.
 */
@ApiTags('Api Keys')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), BrandGuard)
@Controller({ path: 'api-keys', version: '1' })
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Returns the plaintext key once.' })
  async create(@CurrentBrand() brand: Brand, @Body() dto: CreateApiKeyDto) {
    const { apiKey, plaintext } = await this.apiKeysService.generateForBrand(
      brand.id,
      dto.environment,
      dto.label,
    );
    return {
      id: apiKey.id,
      key: plaintext, // shown once — not retrievable later
      keyPrefix: apiKey.keyPrefix,
      environment: apiKey.environment,
      label: apiKey.label ?? null,
      createdAt: apiKey.createdAt,
    };
  }

  // Masked listing for the panel (never returns the plaintext or hash).
  @Get()
  async list(@CurrentBrand() brand: Brand) {
    const keys = await this.apiKeysService.listForBrand(brand.id);
    return keys.map((k) => ({
      id: k.id,
      keyPrefix: k.keyPrefix,
      environment: k.environment,
      label: k.label ?? null,
      lastUsedAt: k.lastUsedAt ?? null,
      revokedAt: k.revokedAt ?? null,
      createdAt: k.createdAt,
    }));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(@CurrentBrand() brand: Brand, @Param('id') id: string) {
    await this.apiKeysService.revokeForBrand(brand.id, id);
  }
}
