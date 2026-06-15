import { Injectable } from '@nestjs/common';
import { OAuthDiscovery } from '../../../../domain/oauth-discovery';
import { OAuthDiscoveryEntity } from '../entities/oauth-discovery.entity';

@Injectable()
export class OAuthDiscoveryMapper {
  toDomain(entity: OAuthDiscoveryEntity): OAuthDiscovery {
    const d = new OAuthDiscovery();
    d.id = entity.id;
    d.userId = entity.userId;
    d.channel = entity.channel;
    d.triggeredBrandId = entity.triggeredBrandId;
    d.accounts = entity.accounts;
    d.expiresAt = entity.expiresAt;
    d.consumedAt = entity.consumedAt;
    d.createdAt = entity.createdAt;
    return d;
  }

  toEntity(domain: OAuthDiscovery): OAuthDiscoveryEntity {
    const e = new OAuthDiscoveryEntity();
    if (domain.id) e.id = domain.id;
    e.userId = domain.userId;
    e.channel = domain.channel;
    e.triggeredBrandId = domain.triggeredBrandId;
    e.accounts = domain.accounts;
    e.expiresAt = domain.expiresAt;
    e.consumedAt = domain.consumedAt;
    return e;
  }
}
