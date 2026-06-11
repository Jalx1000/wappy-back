import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BrandGuard } from '../brands/guards/brand.guard';
import { CurrentBrand } from '../brands/decorators/current-brand.decorator';
import { Brand } from '../brands/domain/brand';
import { PostsService } from './posts.service';
import { UpdatePostDto } from './dto/update-post.dto';

@ApiTags('Posts')
@ApiBearerAuth()
@ApiHeader({ name: 'x-brand-id', required: true })
@UseGuards(AuthGuard('jwt'), BrandGuard)
@Controller({ path: 'posts', version: '1' })
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiQuery({ name: 'from', type: String, required: false })
  @ApiQuery({ name: 'to', type: String, required: false })
  @ApiQuery({ name: 'connectionId', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  async getPosts(
    @CurrentBrand() brand: Brand,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('connectionId') connectionId?: string,
    @Query('limit') limit?: string,
  ) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();
    const connId = connectionId ? parseInt(connectionId, 10) : undefined;
    const pageLimit = limit ? parseInt(limit, 10) : 50;

    return this.postsService.getPostsByBrand(brand.id, fromDate, toDate, connId, pageLimit);
  }

  @Get(':id')
  async getPost(
    @CurrentBrand() brand: Brand,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.postsService.getPostById(id, brand.id);
  }

  @Patch(':id')
  async updatePost(
    @CurrentBrand() brand: Brand,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePostDto,
  ) {
    return this.postsService.updatePost(id, brand.id, updateDto);
  }

  @Delete(':id')
  async deletePost(
    @CurrentBrand() brand: Brand,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.postsService.deletePost(id, brand.id);
    return { success: true };
  }
}
