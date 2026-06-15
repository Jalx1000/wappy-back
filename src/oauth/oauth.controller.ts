import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Logger,
  Param,
  Query,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { OAuthStateService } from './oauth-state.service';
import {
  ChannelOAuthService,
  OAUTH_SERVICES,
} from './oauth-provider.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { OAuthDiscoveriesRepository } from './discovery/infrastructure/persistence/relational/repositories/oauth-discoveries.repository';
import { OAuthDiscovery } from './discovery/domain/oauth-discovery';
import { EncryptionService } from '../encryption/encryption.service';

const DISCOVERY_TTL_MIN = 30;

@ApiTags('OAuth')
@Controller({ path: 'connections', version: '1' })
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);

  constructor(
    private readonly stateService: OAuthStateService,
    @Inject(OAUTH_SERVICES) private readonly oauthServices: ChannelOAuthService[],
    private readonly config: ConfigService,
    private readonly discoveriesRepo: OAuthDiscoveriesRepository,
    private readonly encryption: EncryptionService,
  ) {}

  @Get(':channel/authorize')
  @Throttle({ short: { limit: 20, ttl: 60000 } })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Redirect()
  @ApiQuery({ name: 'brandId', type: Number, required: true })
  async authorize(
    @Param('channel') channel: string,
    @Query('brandId') brandIdRaw: string,
    @CurrentUser() user: JwtPayloadType,
  ) {
    const brandId = parseInt(brandIdRaw, 10);
    if (isNaN(brandId)) throw new BadRequestException('brandId must be a number');

    const svc = this.oauthServices.find((s) => s.urlChannel === channel);
    if (!svc) throw new BadRequestException(`Unknown channel: ${channel}`);

    const state = await this.stateService.generate({
      brandId,
      userId: Number(user.id),
      channel,
    });

    return { url: svc.getAuthorizationUrl(state), statusCode: 302 };
  }

  @Get(':channel/callback')
  @Throttle({ short: { limit: 20, ttl: 60000 } })
  @Redirect()
  async callback(
    @Param('channel') channel: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error?: string,
  ) {
    const frontend = this.config.get<string>(
      'FRONTEND_DOMAIN',
      'http://localhost:3001',
    );
    const portalPath = '/app/connections';

    if (error) {
      this.logger.warn(`OAuth error for channel ${channel}: ${error}`);
      return {
        url: `${frontend}${portalPath}?error=${encodeURIComponent(error)}`,
        statusCode: 302,
      };
    }

    const stateData = await this.stateService.validateAndConsume(state);
    if (!stateData) {
      return {
        url: `${frontend}${portalPath}?error=invalid_state`,
        statusCode: 302,
      };
    }

    const svc = this.oauthServices.find((s) => s.urlChannel === channel);
    if (!svc) {
      return {
        url: `${frontend}${portalPath}?error=unknown_channel`,
        statusCode: 302,
      };
    }

    try {
      const accounts = await svc.exchangeCode(code);

      if (!accounts.length) {
        this.logger.warn(
          `OAuth ${channel}: provider returned 0 accounts (state=${state.slice(0, 8)})`,
        );
        return {
          url: `${frontend}${portalPath}?error=no_accounts`,
          statusCode: 302,
        };
      }

      const discovery = new OAuthDiscovery();
      discovery.userId = stateData.userId;
      discovery.channel = channel;
      discovery.triggeredBrandId = stateData.brandId ?? null;
      discovery.expiresAt = new Date(
        Date.now() + DISCOVERY_TTL_MIN * 60 * 1000,
      );
      discovery.consumedAt = null;
      discovery.accounts = accounts.map((acc) => ({
        channel: acc.channel,
        accountId: acc.accountId,
        accountHandle: acc.accountHandle,
        accessToken: this.encryption.encrypt(acc.accessToken),
        refreshToken: acc.refreshToken
          ? this.encryption.encrypt(acc.refreshToken)
          : undefined,
        expiresAt: acc.expiresAt ? acc.expiresAt.toISOString() : undefined,
        scopes: acc.scopes,
        metadata: acc.metadata,
      }));

      const saved = await this.discoveriesRepo.create(discovery);
      this.logger.log(
        `OAuth ${channel}: discovery ${saved.id} with ${accounts.length} accounts for user ${stateData.userId}`,
      );

      return {
        url: `${frontend}${portalPath}/assign?discoveryId=${saved.id}`,
        statusCode: 302,
      };
    } catch (err) {
      this.logger.error(
        `OAuth callback failed for channel ${channel}`,
        err as Error,
      );
      return {
        url: `${frontend}${portalPath}?error=callback_failed`,
        statusCode: 302,
      };
    }
  }
}
