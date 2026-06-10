import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetricSnapshotEntity } from './entities/metric-snapshot.entity';
import { PostEntity } from './entities/post.entity';
import { MetricSnapshotsRepository } from './repositories/metric-snapshots.repository';
import { PostsRepository } from './repositories/posts.repository';

@Module({
  imports: [TypeOrmModule.forFeature([MetricSnapshotEntity, PostEntity])],
  providers: [MetricSnapshotsRepository, PostsRepository],
  exports: [MetricSnapshotsRepository, PostsRepository],
})
export class MetricsRelationalPersistenceModule {}
