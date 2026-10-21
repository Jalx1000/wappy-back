import { Module } from '@nestjs/common';
import { OrderRepository } from '../order.repository';
import { OrderRelationalRepository } from './repositories/order.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from './entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity])],
  providers: [
    {
      provide: OrderRepository,
      useClass: OrderRelationalRepository,
    },
  ],
  exports: [OrderRepository],
})
export class RelationalOrderPersistenceModule {}
