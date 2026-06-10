import { Post } from '../../../../domain/post';
import { PostEntity } from '../entities/post.entity';

export class PostMapper {
  static toDomain(raw: PostEntity): Post {
    const domain = new Post();
    domain.id = raw.id;
    domain.brandId = raw.brandId;
    domain.connectionId = raw.connectionId;
    domain.externalId = raw.externalId;
    domain.publishedAt = raw.publishedAt;
    domain.type = raw.type;
    domain.caption = raw.caption;
    domain.mediaUrl = raw.mediaUrl;
    domain.metrics = raw.metrics ?? {};
    domain.createdAt = raw.createdAt;
    domain.updatedAt = raw.updatedAt;
    return domain;
  }

  static toPersistence(domain: Post): PostEntity {
    const entity = new PostEntity();
    if (domain.id) entity.id = domain.id;
    entity.brandId = domain.brandId;
    entity.connectionId = domain.connectionId;
    entity.externalId = domain.externalId;
    entity.publishedAt = domain.publishedAt;
    entity.type = domain.type;
    entity.caption = domain.caption ?? null;
    entity.mediaUrl = domain.mediaUrl ?? null;
    entity.metrics = domain.metrics ?? {};
    return entity;
  }
}
