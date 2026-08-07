import { Injectable, NotFoundException } from '@nestjs/common';
import { PostsRepository } from '../metrics/infrastructure/persistence/relational/repositories/posts.repository';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly postsRepo: PostsRepository) {}

  async getPostsByBrand(
    brandId: number,
    from: Date,
    to: Date,
    connectionId?: number,
    limit: number = 50,
  ) {
    return this.postsRepo.findByBrandAndRange(
      brandId,
      from,
      to,
      connectionId,
      limit,
    );
  }

  async getPostById(id: number, brandId: number) {
    const post = await this.postsRepo.findById(id);
    if (!post || post.brandId !== brandId) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  async updatePost(id: number, brandId: number, updateDto: UpdatePostDto) {
    const post = await this.postsRepo.findById(id);
    if (!post || post.brandId !== brandId) {
      throw new NotFoundException('Post not found');
    }

    if (updateDto.caption !== undefined) post.caption = updateDto.caption;
    if (updateDto.mediaUrl !== undefined) post.mediaUrl = updateDto.mediaUrl;
    if (updateDto.type !== undefined) post.type = updateDto.type;

    return this.postsRepo.save(post);
  }

  async deletePost(id: number, brandId: number) {
    const post = await this.postsRepo.findById(id);
    if (!post || post.brandId !== brandId) {
      throw new NotFoundException('Post not found');
    }
    await this.postsRepo.delete(id);
  }
}
