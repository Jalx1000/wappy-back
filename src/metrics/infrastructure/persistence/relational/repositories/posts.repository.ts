import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Post } from '../../../../domain/post';
import { PostEntity } from '../entities/post.entity';
import { PostMapper } from '../mappers/post.mapper';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectRepository(PostEntity)
    private readonly repo: Repository<PostEntity>,
  ) {}

  async upsert(post: Post): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .insert()
      .into(PostEntity)
      .values(PostMapper.toPersistence(post))
      .orUpdate(
        ['publishedAt', 'type', 'caption', 'mediaUrl', 'metrics', 'updatedAt'],
        ['externalId'],
      )
      .execute();
  }

  async upsertMany(posts: Post[]): Promise<void> {
    if (!posts.length) return;
    const entities = posts.map(PostMapper.toPersistence);
    await this.repo
      .createQueryBuilder()
      .insert()
      .into(PostEntity)
      .values(entities)
      .orUpdate(
        ['publishedAt', 'type', 'caption', 'mediaUrl', 'metrics', 'updatedAt'],
        ['externalId'],
      )
      .execute();
  }

  async findTopByConnectionId(
    connectionId: number,
    brandId: number,
    limit: number,
  ): Promise<Post[]> {
    const entities = await this.repo
      .createQueryBuilder('p')
      .where('p.connectionId = :connectionId AND p.brandId = :brandId', {
        connectionId,
        brandId,
      })
      .orderBy(`(p.metrics->>'engagement')::float`, 'DESC', 'NULLS LAST')
      .take(limit)
      .getMany();
    return entities.map(PostMapper.toDomain);
  }

  async findTopByBrandId(brandId: number, limit: number): Promise<Post[]> {
    const entities = await this.repo
      .createQueryBuilder('p')
      .where('p.brandId = :brandId', { brandId })
      .orderBy(`(p.metrics->>'engagement')::float`, 'DESC', 'NULLS LAST')
      .take(limit)
      .getMany();
    return entities.map(PostMapper.toDomain);
  }

  async findByBrandAndRange(brandId: number, from: Date, to: Date): Promise<Post[]> {
    const entities = await this.repo.find({
      where: { brandId, publishedAt: Between(from, to) },
      order: { publishedAt: 'DESC' },
    });
    return entities.map(PostMapper.toDomain);
  }
}
