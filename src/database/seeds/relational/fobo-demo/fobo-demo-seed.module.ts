import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { FoboDemoSeedService } from './fobo-demo-seed.service';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { BrandEntity } from '../../../../brands/infrastructure/persistence/relational/entities/brand.entity';
import { BrandMembershipEntity } from '../../../../brands/infrastructure/persistence/relational/entities/brand-membership.entity';
import { ConnectionEntity } from '../../../../connections/infrastructure/persistence/relational/entities/connection.entity';
import { MetricSnapshotEntity } from '../../../../metrics/infrastructure/persistence/relational/entities/metric-snapshot.entity';
import { PostEntity } from '../../../../metrics/infrastructure/persistence/relational/entities/post.entity';
import { EncryptionModule } from '../../../../encryption/encryption.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      UserEntity,
      BrandEntity,
      BrandMembershipEntity,
      ConnectionEntity,
      MetricSnapshotEntity,
      PostEntity,
    ]),
    EncryptionModule,
  ],
  providers: [FoboDemoSeedService],
  exports: [FoboDemoSeedService],
})
export class FoboDemoSeedModule {}
