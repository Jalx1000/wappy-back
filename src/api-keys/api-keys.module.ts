import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeyGuard } from './guards/api-key.guard';
import { RelationalApiKeyPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { BrandsModule } from '../brands/brands.module';

@Module({
  imports: [
    // do not remove this comment
    RelationalApiKeyPersistenceModule,
    BrandsModule,
  ],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, ApiKeyGuard],
  exports: [ApiKeysService, ApiKeyGuard, RelationalApiKeyPersistenceModule],
})
export class ApiKeysModule {}
