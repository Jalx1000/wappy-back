import { Agent } from '../../../../domain/agent';
import { AgentEntity } from '../entities/agent.entity';

export class AgentMapper {
  static toDomain(raw: AgentEntity): Agent {
    const domainEntity = new Agent();
    domainEntity.brandId = raw.brandId;
    domainEntity.name = raw.name;
    domainEntity.enabled = raw.enabled;
    domainEntity.provider = raw.provider;
    domainEntity.model = raw.model;
    domainEntity.systemPrompt = raw.systemPrompt;
    domainEntity.effort = raw.effort;
    domainEntity.toolsEnabled = raw.toolsEnabled;
    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Agent): AgentEntity {
    const persistenceEntity = new AgentEntity();
    persistenceEntity.brandId = domainEntity.brandId;
    persistenceEntity.name = domainEntity.name;
    persistenceEntity.enabled = domainEntity.enabled;
    persistenceEntity.provider = domainEntity.provider;
    persistenceEntity.model = domainEntity.model;
    persistenceEntity.systemPrompt = domainEntity.systemPrompt;
    persistenceEntity.effort = domainEntity.effort;
    persistenceEntity.toolsEnabled = domainEntity.toolsEnabled;
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    return persistenceEntity;
  }
}
