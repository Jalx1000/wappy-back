import { Module } from '@nestjs/common';
import { MetricsModule } from '../metrics/metrics.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { BrandsModule } from '../brands/brands.module';

@Module({
  imports: [MetricsModule, BrandsModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
