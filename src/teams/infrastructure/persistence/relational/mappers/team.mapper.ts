import { Team } from '../../../../domain/team';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';

import { TeamEntity } from '../entities/team.entity';

export class TeamMapper {
  static toDomain(raw: TeamEntity): Team {
    const domainEntity = new Team();
    if (raw.members) {
      domainEntity.members = raw.members.map((item) =>
        UserMapper.toDomain(item),
      );
    }

    domainEntity.brandId = raw.brandId;

    domainEntity.name = raw.name;

    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Team): TeamEntity {
    const persistenceEntity = new TeamEntity();
    if (domainEntity.members) {
      persistenceEntity.members = domainEntity.members.map((item) =>
        UserMapper.toPersistence(item),
      );
    }

    persistenceEntity.brandId = domainEntity.brandId;

    persistenceEntity.name = domainEntity.name;

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    return persistenceEntity;
  }
}
