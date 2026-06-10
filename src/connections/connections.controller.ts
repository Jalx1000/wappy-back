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
import { Brand } from '../brands/domain/brand';
import { ConnectionsService } from './connections.service';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';

@ApiTags('Connections')
@ApiBearerAuth()
@ApiHeader({ name: 'x-brand-id', required: true })
@UseGuards(AuthGuard('jwt'), BrandGuard)
@Controller({ path: 'connections', version: '1' })
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentBrand() brand: Brand,
    @Body() dto: CreateConnectionDto,
  ) {
    return this.connectionsService.create(brand.id, dto);
  }

  @Get()
  findAll(@CurrentBrand() brand: Brand) {
    return this.connectionsService.findAllForBrand(brand.id);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  findOne(
    @CurrentBrand() brand: Brand,
    @Param('id', ParseIntPipe) id: number,
  ) {
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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: Number })
  remove(
    @CurrentBrand() brand: Brand,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.connectionsService.remove(brand.id, id);
  }

  @Post(':id/sync')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiParam({ name: 'id', type: Number })
  sync(
    @CurrentBrand() brand: Brand,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.connectionsService.enqueueSync(brand.id, id);
  }
}
