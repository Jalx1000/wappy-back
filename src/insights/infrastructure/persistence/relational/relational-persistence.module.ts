import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InsightEntity } from './entities/insight.entity';
import { InsightsRepository } from './repositories/insights.repository';

@Module({
  imports: [TypeOrmModule.forFeature([InsightEntity])],
  providers: [InsightsRepository],
  exports: [InsightsRepository],
})
export class InsightsRelationalPersistenceModule {}
