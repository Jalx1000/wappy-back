import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentRepository } from '../agent.repository';
import { AgentRelationalRepository } from './repositories/agent.repository';
import { AgentEntity } from './entities/agent.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AgentEntity])],
  providers: [
    {
      provide: AgentRepository,
      useClass: AgentRelationalRepository,
    },
  ],
  exports: [AgentRepository],
})
export class RelationalAgentPersistenceModule {}
