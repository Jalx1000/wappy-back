import { Module } from '@nestjs/common';
import { ApiKeyRepository } from '../api-key.repository';
import { ApiKeyRelationalRepository } from './repositories/api-key.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKeyEntity } from './entities/api-key.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKeyEntity])],
  providers: [
    {
      provide: ApiKeyRepository,
      useClass: ApiKeyRelationalRepository,
    },
  ],
  exports: [ApiKeyRepository],
})
export class RelationalApiKeyPersistenceModule {}
