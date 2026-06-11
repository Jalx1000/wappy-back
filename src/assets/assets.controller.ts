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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { Brand } from '../brands/domain/brand';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@ApiTags('Assets')
@ApiBearerAuth()
@ApiHeader({ name: 'x-brand-id', required: true })
@UseGuards(AuthGuard('jwt'), BrandGuard)
@Controller({ path: 'assets', version: '1' })
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  @ApiQuery({ name: 'type', type: String, required: false })
  @ApiQuery({ name: 'tags', type: String, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  async getAssets(
    @CurrentBrand() brand: Brand,
    @Query('type') type?: string,
    @Query('tags') tagsStr?: string,
    @Query('limit') limit?: string,
  ) {
    const tags = tagsStr ? tagsStr.split(',') : undefined;
    const pageLimit = limit ? parseInt(limit, 10) : 50;
    return this.assetsService.getByBrand(brand.id, type, tags, pageLimit);
  }

  @Get(':id')
  async getAsset(
    @CurrentBrand() brand: Brand,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.assetsService.getById(id, brand.id);
  }

  @Post()
  async create(
    @CurrentBrand() brand: Brand,
    @CurrentUser() user: JwtPayloadType,
    @Body() dto: CreateAssetDto,
  ) {
    return this.assetsService.create(brand.id, Number(user.id), dto);
  }

  @Patch(':id')
  async update(
    @CurrentBrand() brand: Brand,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssetDto,
  ) {
    return this.assetsService.update(id, brand.id, dto);
  }

  @Delete(':id')
  async delete(
    @CurrentBrand() brand: Brand,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.assetsService.delete(id, brand.id);
    return { success: true };
  }
}
