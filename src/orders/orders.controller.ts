import { Controller, Get, Body, Patch, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';
import { Order } from './domain/order';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { BrandGuard } from '../brands/guards/brand.guard';
import { CurrentBrand } from '../brands/decorators/current-brand.decorator';
import { Brand } from '../brands/domain/brand';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), BrandGuard)
@Controller({
  path: 'orders',
  version: '1',
})
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // The kanban board: all orders of the brand (UI groups them by status).
  @Get()
  @ApiOkResponse({ type: [Order] })
  list(@CurrentBrand() brand: Brand): Promise<Order[]> {
    return this.ordersService.listForBrand(brand.id);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String, required: true })
  @ApiOkResponse({ type: Order })
  getOne(
    @CurrentBrand() brand: Brand,
    @Param('id') id: string,
  ): Promise<Order> {
    return this.ordersService.getForBrand(brand.id, id);
  }

  // Move the card (status), or edit total/notes.
  @Patch(':id')
  @ApiParam({ name: 'id', type: String, required: true })
  @ApiOkResponse({ type: Order })
  update(
    @CurrentBrand() brand: Brand,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<Order> {
    return this.ordersService.updateForBrand(brand.id, id, dto);
  }
}
