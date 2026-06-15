import { Injectable } from '@nestjs/common';
import { OrphanAccount } from '../../../../domain/orphan-account';
import { OrphanAccountEntity } from '../entities/orphan-account.entity';

@Injectable()
export class OrphanAccountMapper {
  toDomain(entity: OrphanAccountEntity): OrphanAccount {
    const o = new OrphanAccount();
    o.id = entity.id;
    o.channel = entity.channel;
    o.accountId = entity.accountId;
    o.accountHandle = entity.accountHandle;
    o.accessToken = entity.accessToken;
    o.refreshToken = entity.refreshToken;
    o.expiresAt = entity.expiresAt;
    o.scopes = entity.scopes;
    o.metadata = entity.metadata;
    o.discoveredByUserId = entity.discoveredByUserId;
    o.discoveredAt = entity.discoveredAt;
    return o;
  }

  toEntity(domain: OrphanAccount): OrphanAccountEntity {
    const e = new OrphanAccountEntity();
    if (domain.id) e.id = domain.id;
    e.channel = domain.channel;
    e.accountId = domain.accountId;
    e.accountHandle = domain.accountHandle;
    e.accessToken = domain.accessToken;
    e.refreshToken = domain.refreshToken;
    e.expiresAt = domain.expiresAt;
    e.scopes = domain.scopes;
    e.metadata = domain.metadata;
    e.discoveredByUserId = domain.discoveredByUserId;
    return e;
  }
}
