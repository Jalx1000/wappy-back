import { Module } from '@nestjs/common';
import { MetricsModule } from '../metrics/metrics.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [MetricsModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
