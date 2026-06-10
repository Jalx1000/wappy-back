import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { GoogleAdsApi } from 'google-ads-api';
import { ChannelEnum } from '../../../connections/domain/channel.enum';
import {
  ChannelOAuthService,
  OAuthAccountResult,
} from '../../../oauth/oauth-provider.interface';

const SCOPES = ['https://www.googleapis.com/auth/adwords'];

@Injectable()
export class GoogleAdsOAuthService implements ChannelOAuthService {
  readonly urlChannel = 'google-ads';

  constructor(private readonly config: ConfigService) {}

  getAuthorizationUrl(state: string): string {
    const oauth2Client = this.createOAuth2Client();
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: SCOPES,
      state,
    });
  }

  async exchangeCode(code: string): Promise<OAuthAccountResult[]> {
    const clientId = this.config.getOrThrow<string>('GOOGLE_ADS_CLIENT_ID');
    const clientSecret = this.config.getOrThrow<string>('GOOGLE_ADS_CLIENT_SECRET');
    const developerToken = this.config.getOrThrow<string>('GOOGLE_ADS_DEVELOPER_TOKEN');

    const oauth2Client = this.createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    const accessToken = tokens.access_token!;
    const refreshToken = tokens.refresh_token!;
    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000);

    const adsClient = new GoogleAdsApi({
      client_id: clientId,
      client_secret: clientSecret,
      developer_token: developerToken,
    });

    // listAccessibleCustomers is on the GoogleAdsApi instance
    const accessible = await adsClient.listAccessibleCustomers(refreshToken);
    const results: OAuthAccountResult[] = [];

    for (const resourceName of accessible.resource_names ?? []) {
      const customerId = resourceName.replace('customers/', '');

      let customerName = customerId;
      try {
        const c = adsClient.Customer({ customer_id: customerId, refresh_token: refreshToken });
        const [row] = await c.query(
          `SELECT customer.id, customer.descriptive_name FROM customer LIMIT 1`,
        );
        customerName =
          (row?.customer?.descriptive_name as string | undefined) ?? customerId;
      } catch {
        // Use customerId as fallback if query fails (manager accounts, etc.)
      }

      results.push({
        channel: ChannelEnum.google_ads,
        accountId: customerId,
        accountHandle: customerName,
        accessToken,
        refreshToken,
        expiresAt,
        scopes: SCOPES,
        metadata: { resourceName, customerId },
      });
    }
    return results;
  }

  private createOAuth2Client() {
    return new google.auth.OAuth2(
      this.config.getOrThrow<string>('GOOGLE_ADS_CLIENT_ID'),
      this.config.getOrThrow<string>('GOOGLE_ADS_CLIENT_SECRET'),
      this.config.getOrThrow<string>('GOOGLE_ADS_REDIRECT_URI'),
    );
  }
}
