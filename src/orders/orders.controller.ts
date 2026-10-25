import {
  Controller,
  Get,
  Body,
  Patch,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
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
  // With ?contactId= it returns that contact's orders — used to warn with the
  // count (N) before deleting the contact (S5).
  @Get()
  @ApiQuery({ name: 'contactId', type: String, required: false })
  @ApiOkResponse({ type: [Order] })
  list(
    @CurrentBrand() brand: Brand,
    @Query('contactId') contactId?: string,
  ): Promise<Order[]> {
    return contactId
      ? this.ordersService.findManyForContact(brand.id, contactId)
      : this.ordersService.listForBrand(brand.id);
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

  // Delete a single order (one card), leaving the contact's others intact.
  @Delete(':id')
  @ApiParam({ name: 'id', type: String, required: true })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentBrand() brand: Brand, @Param('id') id: string): Promise<void> {
    return this.ordersService.removeForBrand(brand.id, id);
  }
}
