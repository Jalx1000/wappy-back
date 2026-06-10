import { Module } from '@nestjs/common';
import { MetricsRelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [MetricsRelationalPersistenceModule],
  exports: [MetricsRelationalPersistenceModule],
})
export class MetricsModule {}
