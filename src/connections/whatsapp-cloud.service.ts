import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ChannelEnum } from './domain/channel.enum';
import { Connection } from './domain/connection';
import { ConnectionsService } from './connections.service';
import { ConnectWhatsappCloudDto } from './dto/connect-whatsapp-cloud.dto';
import { OnboardCoexistenceDto } from './dto/onboard-coexistence.dto';

@Injectable()
export class WhatsappCloudService {
  private readonly logger = new Logger(WhatsappCloudService.name);

  constructor(
    private readonly connectionsService: ConnectionsService,
    private readonly config: ConfigService,
  ) {}

  private get graphUrl(): string {
    const v = this.config.get<string>('META_GRAPH_VERSION', 'v25.0');
    return `https://graph.facebook.com/${v}`;
  }

  /**
   * Creates a WhatsApp Cloud API connection from manually-provided credentials
   * (accountId = phone_number_id, accessToken = permanent/system-user token) and
   * best-effort subscribes our app to the WABA so message webhooks flow.
   */
  async connect(
    brandId: number,
    dto: ConnectWhatsappCloudDto,
  ): Promise<Connection> {
    const connection = await this.connectionsService.create(brandId, {
      channel: ChannelEnum.whatsapp,
      accountHandle: dto.displayName || dto.phoneNumber || dto.phoneNumberId,
      accountId: dto.phoneNumberId,
      accessToken: dto.accessToken,
      metadata: {
        wabaId: dto.wabaId,
        appId: dto.appId ?? null,
        phoneNumber: dto.phoneNumber ?? null,
        category: dto.category ?? null,
        displayName: dto.displayName ?? null,
        platform: 'cloud_api',
      },
    });

    await this.subscribeApp(dto.wabaId, dto.accessToken);
    return connection;
  }

  /**
   * Coexistence onboarding: exchanges the Embedded Signup `code` for a business
   * access token, verifies the number is on both the app and Cloud API, creates
   * the connection, and subscribes our app to the WABA. The number is already
   * registered (WhatsApp Business app) so registration is skipped.
   */
  async onboardCoexistence(
    brandId: number,
    dto: OnboardCoexistenceDto,
  ): Promise<Connection> {
    // Use the WhatsApp app (Wappy) credentials, not the Meta OAuth app.
    const clientId = this.config.getOrThrow<string>('FACEBOOK_APP_ID');
    const clientSecret = this.config.getOrThrow<string>('FACEBOOK_APP_SECRET');

    const token = await this.exchangeCode(clientId, clientSecret, dto.code);
    // The coexistence session event returns waba_id only; resolve the phone
    // number id from the WABA if the front did not provide it.
    const phoneNumberId =
      dto.phoneNumberId ?? (await this.resolvePhoneNumberId(dto.wabaId, token));
    const status = await this.fetchStatus(phoneNumberId, token);

    const connection = await this.connectionsService.create(brandId, {
      channel: ChannelEnum.whatsapp,
      accountHandle: phoneNumberId,
      accountId: phoneNumberId,
      accessToken: token,
      metadata: {
        wabaId: dto.wabaId,
        platform: 'coexistence',
        isOnBizApp: status.isOnBizApp,
        platformType: status.platformType,
      },
    });

    await this.subscribeApp(dto.wabaId, token);
    return connection;
  }

  private async resolvePhoneNumberId(
    wabaId: string,
    token: string,
  ): Promise<string> {
    try {
      const { data } = await axios.get<{ data?: Array<{ id?: string }> }>(
        `${this.graphUrl}/${wabaId}/phone_numbers`,
        {
          params: { fields: 'id,display_phone_number' },
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const id = data?.data?.[0]?.id;
      if (!id) {
        throw new BadGatewayException('WABA has no phone numbers');
      }
      return id;
    } catch (err) {
      throw new BadGatewayException(
        this.metaError(err, 'Could not resolve phone number from WABA'),
      );
    }
  }

  private async exchangeCode(
    clientId: string,
    clientSecret: string,
    code: string,
  ): Promise<string> {
    try {
      const { data } = await axios.get<{ access_token?: string }>(
        `${this.graphUrl}/oauth/access_token`,
        { params: { client_id: clientId, client_secret: clientSecret, code } },
      );
      if (!data.access_token) {
        throw new BadGatewayException('Code exchange returned no access_token');
      }
      return data.access_token;
    } catch (err) {
      throw new BadGatewayException(
        this.metaError(err, 'Code exchange failed'),
      );
    }
  }

  private async fetchStatus(
    phoneNumberId: string,
    token: string,
  ): Promise<{ isOnBizApp: boolean | null; platformType: string | null }> {
    try {
      const { data } = await axios.get<{
        is_on_biz_app?: boolean;
        platform_type?: string;
      }>(`${this.graphUrl}/${phoneNumberId}`, {
        params: { fields: 'is_on_biz_app,platform_type' },
        headers: { Authorization: `Bearer ${token}` },
      });
      return {
        isOnBizApp: data.is_on_biz_app ?? null,
        platformType: data.platform_type ?? null,
      };
    } catch (err) {
      this.logger.warn(
        `Could not fetch phone status: ${this.metaError(err, '')}`,
      );
      return { isOnBizApp: null, platformType: null };
    }
  }

  private metaError(err: unknown, fallback: string): string {
    if (axios.isAxiosError(err)) {
      return (
        (err.response?.data as { error?: { message?: string } })?.error
          ?.message ??
        err.message ??
        fallback
      );
    }
    return fallback || String(err);
  }

  private async subscribeApp(wabaId: string, token: string): Promise<void> {
    try {
      await axios.post(
        `${this.graphUrl}/${wabaId}/subscribed_apps`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      this.logger.log(`Subscribed app to WABA ${wabaId}`);
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? ((err.response?.data as { error?: { message?: string } })?.error
            ?.message ?? err.message)
        : String(err);
      // Non-fatal: the connection is still created; the user can retry the
      // subscription or configure it in the Meta console.
      this.logger.warn(`Could not subscribe app to WABA ${wabaId}: ${msg}`);
    }
  }
}
