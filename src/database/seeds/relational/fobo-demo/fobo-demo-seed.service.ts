import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { BrandEntity } from '../../../../brands/infrastructure/persistence/relational/entities/brand.entity';
import { BrandMembershipEntity } from '../../../../brands/infrastructure/persistence/relational/entities/brand-membership.entity';
import { ConnectionEntity } from '../../../../connections/infrastructure/persistence/relational/entities/connection.entity';
import { MetricSnapshotEntity } from '../../../../metrics/infrastructure/persistence/relational/entities/metric-snapshot.entity';
import { PostEntity } from '../../../../metrics/infrastructure/persistence/relational/entities/post.entity';
import { RoleEnum } from '../../../../roles/roles.enum';
import { StatusEnum } from '../../../../statuses/statuses.enum';
import { ChannelEnum } from '../../../../connections/domain/channel.enum';
import { ConnectionStatusEnum } from '../../../../connections/domain/connection-status.enum';
import { MetricEnum } from '../../../../metrics/domain/metric.enum';
import { BrandMemberRoleEnum } from '../../../../brands/domain/brand-membership';
import { EncryptionService } from '../../../../encryption/encryption.service';

const BRANDS = [
  {
    name: 'Sofía Café',
    slug: 'sofia-cafe',
    description: 'Cafetería artesanal boliviana',
  },
  { name: 'TiendaBol', slug: 'tiendabol', description: 'E-commerce boliviano' },
  { name: 'BolFin', slug: 'bolfin', description: 'Fintech boliviana' },
];

@Injectable()
export class FoboDemoSeedService {
  private readonly logger = new Logger(FoboDemoSeedService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(BrandEntity)
    private readonly brandsRepo: Repository<BrandEntity>,
    @InjectRepository(BrandMembershipEntity)
    private readonly membershipsRepo: Repository<BrandMembershipEntity>,
    @InjectRepository(ConnectionEntity)
    private readonly connectionsRepo: Repository<ConnectionEntity>,
    @InjectRepository(MetricSnapshotEntity)
    private readonly snapshotsRepo: Repository<MetricSnapshotEntity>,
    @InjectRepository(PostEntity)
    private readonly postsRepo: Repository<PostEntity>,
    private readonly encryptionService: EncryptionService,
  ) {}

  async run(): Promise<void> {
    const agencyAdmin = await this.seedAgencyAdmin();
    const brands = await this.seedBrands(agencyAdmin.id);
    for (const brand of brands) {
      const connections = await this.seedConnections(brand);
      for (const conn of connections) {
        await this.seedMetrics(conn.id, brand.id);
        await this.seedPosts(conn.id, brand.id);
      }
    }
    this.logger.log('Fobo demo seed completed');
  }

  private async seedAgencyAdmin(): Promise<UserEntity> {
    const existing = await this.usersRepo.findOne({
      where: { email: 'admin@fobo.com' },
    });
    if (existing) return existing;

    const salt = await bcrypt.genSalt();
    const password = await bcrypt.hash('Admin123!', salt);

    return this.usersRepo.save(
      this.usersRepo.create({
        firstName: 'Agencia',
        lastName: 'Fobo',
        email: 'admin@fobo.com',
        password,
        role: { id: RoleEnum.agency_admin, name: 'Agency Admin' },
        status: { id: StatusEnum.active, name: 'Active' },
      }),
    );
  }

  private async seedBrands(adminId: number): Promise<BrandEntity[]> {
    const result: BrandEntity[] = [];
    for (const b of BRANDS) {
      let brand = await this.brandsRepo.findOne({ where: { slug: b.slug } });
      if (!brand) {
        brand = await this.brandsRepo.save(
          this.brandsRepo.create({ ...b, isActive: true }),
        );
        await this.membershipsRepo.save(
          this.membershipsRepo.create({
            userId: adminId,
            brandId: brand.id,
            role: BrandMemberRoleEnum.admin,
          }),
        );
        this.logger.log(`Created brand: ${brand.name}`);
      }
      result.push(brand);
    }
    return result;
  }

  private async seedConnections(
    brand: BrandEntity,
  ): Promise<ConnectionEntity[]> {
    const channels = [ChannelEnum.instagram, ChannelEnum.facebook_page];
    const result: ConnectionEntity[] = [];

    for (const channel of channels) {
      const existing = await this.connectionsRepo.findOne({
        where: { brandId: brand.id, channel },
      });
      if (existing) {
        result.push(existing);
        continue;
      }

      const conn = await this.connectionsRepo.save(
        this.connectionsRepo.create({
          brandId: brand.id,
          channel,
          accountHandle: `@${brand.slug}_${channel}`,
          accountId: `mock_${brand.slug}_${channel}_001`,
          accessToken: this.encryptionService.encrypt('mock_access_token_dev'),
          refreshToken: this.encryptionService.encrypt(
            'mock_refresh_token_dev',
          ),
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          status: ConnectionStatusEnum.connected,
          scopes: ['read_insights', 'pages_read_engagement'],
          metadata: {},
        }),
      );
      result.push(conn);
    }
    return result;
  }

  private async seedMetrics(
    connectionId: number,
    brandId: number,
  ): Promise<void> {
    const existing = await this.snapshotsRepo.count({
      where: { connectionId },
    });
    if (existing > 0) return;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let followers = 5000 + Math.floor(Math.random() * 5000);
    const snapshots: MetricSnapshotEntity[] = [];

    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setUTCDate(today.getUTCDate() - i);

      const growthRate = 0.003 + Math.random() * 0.009;
      followers = Math.round(followers * (1 + growthRate));
      const engagementRate = 0.02 + Math.random() * 0.06;
      const reach = Math.round(followers * (0.05 + Math.random() * 0.15));
      const impressions = Math.round(reach * (1.2 + Math.random() * 0.8));
      const engagement = Math.round(reach * engagementRate);
      const likes = Math.round(engagement * 0.75);
      const comments = Math.round(engagement * 0.1);
      const shares = Math.round(engagement * 0.15);

      const mkSnap = (metric: MetricEnum, value: number) => {
        const s = new MetricSnapshotEntity();
        s.connectionId = connectionId;
        s.brandId = brandId;
        s.date = date;
        s.metric = metric;
        s.value = value;
        return s;
      };

      snapshots.push(
        mkSnap(MetricEnum.followers, followers),
        mkSnap(MetricEnum.reach, reach),
        mkSnap(MetricEnum.impressions, impressions),
        mkSnap(MetricEnum.engagement, engagement),
        mkSnap(
          MetricEnum.engagement_rate,
          Math.round(engagementRate * 10000) / 100,
        ),
        mkSnap(MetricEnum.likes, likes),
        mkSnap(MetricEnum.comments, comments),
        mkSnap(MetricEnum.shares, shares),
      );
    }

    await this.snapshotsRepo.save(snapshots);
    this.logger.log(
      `Seeded ${snapshots.length} snapshots for connection ${connectionId}`,
    );
  }

  private async seedPosts(
    connectionId: number,
    brandId: number,
  ): Promise<void> {
    const existing = await this.postsRepo.count({ where: { connectionId } });
    if (existing > 0) return;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const types = ['image', 'video', 'carousel', 'reel', 'story'];
    const posts: PostEntity[] = [];

    for (let i = 0; i < 30; i++) {
      const daysAgo = Math.floor((i / 30) * 89);
      const date = new Date(today);
      date.setUTCDate(today.getUTCDate() - daysAgo);

      const externalId = `seed_${connectionId}_post_${i}`;
      const exists = await this.postsRepo.findOne({ where: { externalId } });
      if (exists) continue;

      const reach = 500 + Math.floor(Math.random() * 4000);
      const engagementRate = 0.02 + Math.random() * 0.08;
      const engagement = Math.round(reach * engagementRate);

      const p = new PostEntity();
      p.brandId = brandId;
      p.connectionId = connectionId;
      p.externalId = externalId;
      p.publishedAt = date;
      p.type = types[i % types.length];
      p.caption = `Publicación de demo #${i + 1} — generada para Fobo Metrics`;
      p.mediaUrl = null;
      p.metrics = {
        reach,
        impressions: Math.round(reach * 1.3),
        engagement,
        likes: Math.round(engagement * 0.75),
        comments: Math.round(engagement * 0.1),
        shares: Math.round(engagement * 0.15),
      };
      posts.push(p);
    }

    await this.postsRepo.save(posts);
    this.logger.log(
      `Seeded ${posts.length} posts for connection ${connectionId}`,
    );
  }
}
