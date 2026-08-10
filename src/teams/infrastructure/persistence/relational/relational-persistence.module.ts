import { Module } from '@nestjs/common';
import { TeamRepository } from '../team.repository';
import { TeamRelationalRepository } from './repositories/team.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamEntity } from './entities/team.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TeamEntity])],
  providers: [
    {
      provide: TeamRepository,
      useClass: TeamRelationalRepository,
    },
  ],
  exports: [TeamRepository],
})
export class RelationalTeamPersistenceModule {}
