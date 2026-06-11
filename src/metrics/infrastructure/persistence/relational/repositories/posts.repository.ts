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

  async findByBrandAndRange(
    brandId: number,
    from: Date,
    to: Date,
    connectionId?: number,
    limit: number = 50,
  ): Promise<Post[]> {
    const query = this.repo.createQueryBuilder('p')
      .where('p.brandId = :brandId', { brandId })
      .andWhere('p.publishedAt BETWEEN :from AND :to', { from, to });

    if (connectionId) {
      query.andWhere('p.connectionId = :connectionId', { connectionId });
    }

    const entities = await query
      .orderBy('p.publishedAt', 'DESC')
      .take(limit)
      .getMany();

    return entities.map(PostMapper.toDomain);
  }

  async findById(id: number): Promise<Post | null> {
    const entity = await this.repo.findOne({
      where: { id },
    });
    return entity ? PostMapper.toDomain(entity) : null;
  }

  async save(post: Post): Promise<Post> {
    const entity = PostMapper.toPersistence(post);
    const saved = await this.repo.save(entity);
    return PostMapper.toDomain(saved);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
