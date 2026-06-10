import { Connection } from '../../../../domain/connection';
import { ConnectionEntity } from '../entities/connection.entity';

export class ConnectionMapper {
  static toDomain(raw: ConnectionEntity): Connection {
    const domain = new Connection();
    domain.id = raw.id;
    domain.brandId = raw.brandId;
    domain.channel = raw.channel;
    domain.accountHandle = raw.accountHandle;
    domain.accountId = raw.accountId;
    domain.accessToken = raw.accessToken;
    domain.refreshToken = raw.refreshToken;
    domain.expiresAt = raw.expiresAt;
    domain.status = raw.status;
    domain.lastSyncAt = raw.lastSyncAt;
    domain.scopes = raw.scopes ?? [];
    domain.metadata = raw.metadata ?? {};
    domain.createdAt = raw.createdAt;
    domain.updatedAt = raw.updatedAt;
    domain.deletedAt = raw.deletedAt;
    return domain;
  }

  static toPersistence(domain: Connection): ConnectionEntity {
    const entity = new ConnectionEntity();
    if (domain.id) entity.id = domain.id;
    entity.brandId = domain.brandId;
    entity.channel = domain.channel;
    entity.accountHandle = domain.accountHandle;
    entity.accountId = domain.accountId;
    entity.accessToken = domain.accessToken;
    entity.refreshToken = domain.refreshToken ?? null;
    entity.expiresAt = domain.expiresAt ?? null;
    entity.status = domain.status;
    entity.lastSyncAt = domain.lastSyncAt ?? null;
    entity.scopes = domain.scopes ?? [];
    entity.metadata = domain.metadata ?? {};
    return entity;
  }
}
