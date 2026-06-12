import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { google } from 'googleapis';
import { ChannelEnum } from '../../../connections/domain/channel.enum';
import {
  ChannelOAuthService,
  OAuthAccountResult,
} from '../../../oauth/oauth-provider.interface';

const SCOPES = ['https://www.googleapis.com/auth/adwords'];
const ADS_API_VERSION = 'v17';

interface CustomerSearchResult {
  results?: Array<{
    customer?: {
      id?: string;
      descriptiveName?: string;
      currencyCode?: string;
      timeZone?: string;
      manager?: boolean;
    };
  }>;
}

@Injectable()
export class GoogleAdsOAuthService implements ChannelOAuthService {
  readonly urlChannel = 'google_ads';
  private readonly logger = new Logger(GoogleAdsOAuthService.name);

  constructor(private readonly config: ConfigService) {}

  private buildOAuthClient() {
    return new google.auth.OAuth2({
      clientId: this.config.getOrThrow<string>('GOOGLE_ADS_CLIENT_ID'),
      clientSecret: this.config.getOrThrow<string>('GOOGLE_ADS_CLIENT_SECRET'),
      redirectUri: this.config.getOrThrow<string>('GOOGLE_ADS_REDIRECT_URI'),
    });
  }

  getAuthorizationUrl(state: string): string {
    const oauth2 = this.buildOAuthClient();
    return oauth2.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: SCOPES,
      state,
    });
  }

  async exchangeCode(code: string): Promise<OAuthAccountResult[]> {
    const oauth2 = this.buildOAuthClient();
    const { tokens } = await oauth2.getToken(code);
    if (!tokens.access_token) {
      throw new Error('Google Ads OAuth: missing access_token');
    }

    const developerToken = this.config.getOrThrow<string>(
      'GOOGLE_ADS_DEVELOPER_TOKEN',
    );

    // 1) Listar customer IDs accesibles
    const { data: listResp } = await axios.get<{ resourceNames?: string[] }>(
      `https://googleads.googleapis.com/${ADS_API_VERSION}/customers:listAccessibleCustomers`,
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          'developer-token': developerToken,
        },
      },
    );
    const resourceNames = listResp.resourceNames ?? [];
    const customerIds = resourceNames.map((rn) =>
      rn.replace('customers/', ''),
    );

    if (!customerIds.length) {
      this.logger.warn(
        'Google Ads OAuth completed but user has no accessible customers',
      );
      return [];
    }

    // 2) Para cada customer, query basic info
    const results: OAuthAccountResult[] = [];
    for (const customerId of customerIds) {
      try {
        const { data: searchResp } = await axios.post<CustomerSearchResult>(
          `https://googleads.googleapis.com/${ADS_API_VERSION}/customers/${customerId}/googleAds:search`,
          {
            query:
              'SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone, customer.manager FROM customer LIMIT 1',
          },
          {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              'developer-token': developerToken,
              'login-customer-id': customerId,
            },
          },
        );
        const customer = searchResp.results?.[0]?.customer;
        results.push({
          channel: ChannelEnum.google_ads,
          accountId: customerId,
          accountHandle: customer?.descriptiveName ?? customerId,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token ?? undefined,
          expiresAt: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : undefined,
          scopes: SCOPES,
          metadata: {
            customerId,
            customerName: customer?.descriptiveName ?? null,
            currencyCode: customer?.currencyCode ?? null,
            timeZone: customer?.timeZone ?? null,
            isManager: customer?.manager ?? false,
          },
        });
      } catch (err) {
        const e = err as {
          response?: { data?: { error?: { message?: string } } };
          message?: string;
        };
        this.logger.warn(
          `Skipping customer ${customerId}: ${e.response?.data?.error?.message ?? e.message}`,
        );
      }
    }

    return results;
  }
}
