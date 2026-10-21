import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { OrderEntity } from '../entities/order.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { Order } from '../../../../domain/order';
import { OrderRepository } from '../../order.repository';
import { OrderMapper } from '../mappers/order.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class OrderRelationalRepository implements OrderRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
  ) {}

  async create(data: Order): Promise<Order> {
    const persistenceModel = OrderMapper.toPersistence(data);
    const newEntity = await this.orderRepository.save(
      this.orderRepository.create(persistenceModel),
    );
    return OrderMapper.toDomain(newEntity);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<Order[]> {
    const entities = await this.orderRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });

    return entities.map((entity) => OrderMapper.toDomain(entity));
  }

  async findById(id: Order['id']): Promise<NullableType<Order>> {
    const entity = await this.orderRepository.findOne({
      where: { id },
    });

    return entity ? OrderMapper.toDomain(entity) : null;
  }

  async findByIds(ids: Order['id'][]): Promise<Order[]> {
    const entities = await this.orderRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => OrderMapper.toDomain(entity));
  }

  async update(id: Order['id'], payload: Partial<Order>): Promise<Order> {
    const entity = await this.orderRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Record not found');
    }

    const updatedEntity = await this.orderRepository.save(
      this.orderRepository.create(
        OrderMapper.toPersistence({
          ...OrderMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return OrderMapper.toDomain(updatedEntity);
  }

  async remove(id: Order['id']): Promise<void> {
    await this.orderRepository.delete(id);
  }
}
