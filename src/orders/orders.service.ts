import {
  // common
  Injectable,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderRepository } from './infrastructure/persistence/order.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Order } from './domain/order';

@Injectable()
export class OrdersService {
  constructor(
    // Dependencies here
    private readonly orderRepository: OrderRepository,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    // Do not remove comment below.
    // <creating-property />

    return this.orderRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
      notes: createOrderDto.notes,

      currency: createOrderDto.currency,

      total: createOrderDto.total,

      status: createOrderDto.status,

      contactId: createOrderDto.contactId,

      brandId: createOrderDto.brandId,
    });
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.orderRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: Order['id']) {
    return this.orderRepository.findById(id);
  }

  findByIds(ids: Order['id'][]) {
    return this.orderRepository.findByIds(ids);
  }

  async update(
    id: Order['id'],

    updateOrderDto: UpdateOrderDto,
  ) {
    // Do not remove comment below.
    // <updating-property />

    return this.orderRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      notes: updateOrderDto.notes,

      currency: updateOrderDto.currency,

      total: updateOrderDto.total,

      status: updateOrderDto.status,

      contactId: updateOrderDto.contactId,

      brandId: updateOrderDto.brandId,
    });
  }

  remove(id: Order['id']) {
    return this.orderRepository.remove(id);
  }
}
