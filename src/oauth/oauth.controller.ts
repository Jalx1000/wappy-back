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
import { ConnectionsService } from '../connections/connections.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';

@ApiTags('OAuth')
@Controller({ path: 'connections', version: '1' })
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);

  constructor(
    private readonly stateService: OAuthStateService,
    @Inject(OAUTH_SERVICES) private readonly oauthServices: ChannelOAuthService[],
    private readonly connectionsService: ConnectionsService,
    private readonly config: ConfigService,
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
    const frontend = this.config.get<string>('FRONTEND_DOMAIN', 'http://localhost:3200');

    if (error) {
      this.logger.warn(`OAuth error for channel ${channel}: ${error}`);
      return { url: `${frontend}/connections?error=${encodeURIComponent(error)}`, statusCode: 302 };
    }

    const stateData = await this.stateService.validateAndConsume(state);
    if (!stateData) {
      return { url: `${frontend}/connections?error=invalid_state`, statusCode: 302 };
    }

    const svc = this.oauthServices.find((s) => s.urlChannel === channel);
    if (!svc) {
      return { url: `${frontend}/connections?error=unknown_channel`, statusCode: 302 };
    }

    try {
      const accounts = await svc.exchangeCode(code);
      const connections = await Promise.all(
        accounts.map((acc) =>
          this.connectionsService.upsertFromOAuth(stateData.brandId, acc),
        ),
      );
      const ids = connections.map((c) => c.id).join(',');
      return {
        url: `${frontend}/connections?success=true&connectionIds=${ids}`,
        statusCode: 302,
      };
    } catch (err) {
      this.logger.error(`OAuth callback failed for channel ${channel}`, err);
      return { url: `${frontend}/connections?error=callback_failed`, statusCode: 302 };
    }
  }
}
