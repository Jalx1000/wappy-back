import { Team } from '../../../../domain/team';
import { UserMapper } from '../../../../../users/infrastructure/persistence/document/mappers/user.mapper';

import { TeamSchemaClass } from '../entities/team.schema';

export class TeamMapper {
  public static toDomain(raw: TeamSchemaClass): Team {
    const domainEntity = new Team();
    if (raw.members) {
      domainEntity.members = raw.members.map((item) =>
        UserMapper.toDomain(item),
      );
    }

    domainEntity.brandId = raw.brandId;

    domainEntity.name = raw.name;

    domainEntity.id = raw._id.toString();
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  public static toPersistence(domainEntity: Team): TeamSchemaClass {
    const persistenceSchema = new TeamSchemaClass();
    if (domainEntity.members) {
      persistenceSchema.members = domainEntity.members.map((item) =>
        UserMapper.toPersistence(item),
      );
    }

    persistenceSchema.brandId = domainEntity.brandId;

    persistenceSchema.name = domainEntity.name;

    if (domainEntity.id) {
      persistenceSchema._id = domainEntity.id;
    }
    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;

    return persistenceSchema;
  }
}
