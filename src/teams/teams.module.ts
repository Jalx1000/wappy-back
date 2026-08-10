import { UsersModule } from '../users/users.module';
import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { RelationalTeamPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import databaseConfig from '../database/config/database.config';
import { DatabaseConfig } from '../database/config/database-config.type';
import { DocumentTeamPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';

const infrastructurePersistenceModule = (databaseConfig() as DatabaseConfig)
  .isDocumentDatabase
  ? DocumentTeamPersistenceModule
  : RelationalTeamPersistenceModule;

@Module({
  imports: [
    UsersModule,

    // do not remove this comment
    infrastructurePersistenceModule,
  ],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService, infrastructurePersistenceModule],
})
export class TeamsModule {}
