import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectionEntity } from './entities/connection.entity';
import { ConnectionsRepository } from './repositories/connections.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ConnectionEntity])],
  providers: [ConnectionsRepository],
  exports: [ConnectionsRepository],
})
export class ConnectionsRelationalPersistenceModule {}
