import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ChannelEnum } from './domain/channel.enum';
import { AuthGuard } from '@nestjs/passport';
import { BrandGuard } from '../brands/guards/brand.guard';
import { CurrentBrand } from '../brands/decorators/current-brand.decorator';
import { Brand } from '../brands/domain/brand';
import { ConnectionsService } from './connections.service';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import { SyncConnectionDto } from './dto/sync-connection.dto';

@ApiTags('Connections')
@ApiBearerAuth()
@ApiHeader({ name: 'x-brand-id', required: true })
@UseGuards(AuthGuard('jwt'), BrandGuard)
@Controller({ path: 'connections', version: '1' })
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentBrand() brand: Brand, @Body() dto: CreateConnectionDto) {
    return this.connectionsService.create(brand.id, dto);
  }

  @Get()
  findAll(@CurrentBrand() brand: Brand) {
    return this.connectionsService.findAllForBrand(brand.id);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  findOne(@CurrentBrand() brand: Brand, @Param('id', ParseIntPipe) id: number) {
    return this.connectionsService.findOne(brand.id, id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: Number })
  update(
    @CurrentBrand() brand: Brand,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateConnectionDto,
  ) {
    return this.connectionsService.update(brand.id, id, dto);
  }

  @Patch(':id/brand')
  @ApiParam({ name: 'id', type: Number })
  reassign(
    @CurrentBrand() brand: Brand,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { brandId: number },
  ) {
    return this.connectionsService.reassignBrand(brand.id, id, dto.brandId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: Number })
  remove(@CurrentBrand() brand: Brand, @Param('id', ParseIntPipe) id: number) {
    return this.connectionsService.remove(brand.id, id);
  }

  @Post(':id/sync')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiParam({ name: 'id', type: Number })
  sync(
    @CurrentBrand() brand: Brand,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SyncConnectionDto,
  ) {
    return this.connectionsService.enqueueSync(brand.id, id, dto.from, dto.to);
  }

  @Get(':id/sync-jobs/:jobId')
  @ApiParam({ name: 'id', type: Number })
  @ApiParam({ name: 'jobId', type: String })
  @ApiQuery({
    name: 'queue',
    enum: ['web', 'ads', 'social'],
    required: false,
  })
  async getSyncJob(
    @CurrentBrand() brand: Brand,
    @Param('id', ParseIntPipe) id: number,
    @Param('jobId') jobId: string,
    @Query('queue') queueHint?: 'web' | 'ads' | 'social',
  ) {
    const connection = await this.connectionsService.findOne(brand.id, id);
    const queueName = queueHint ?? this.resolveQueue(connection.channel);
    const result = await this.connectionsService.getJobState(queueName, jobId);
    if (!result) throw new NotFoundException(`Job ${jobId} not found`);
    return result;
  }

  private resolveQueue(channel: ChannelEnum): 'web' | 'ads' | 'social' {
    if (channel === ChannelEnum.ga4) return 'web';
    if (
      channel === ChannelEnum.google_ads ||
      channel === ChannelEnum.meta_ads ||
      channel === ChannelEnum.tiktok_ads ||
      channel === ChannelEnum.linkedin_ads
    )
      return 'ads';
    return 'social';
  }
}
