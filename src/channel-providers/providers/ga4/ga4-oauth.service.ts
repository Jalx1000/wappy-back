import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { ChannelEnum } from '../../../connections/domain/channel.enum';
import {
  ChannelOAuthService,
  OAuthAccountResult,
} from '../../../oauth/oauth-provider.interface';

const SCOPES = ['https://www.googleapis.com/auth/analytics.readonly'];

@Injectable()
export class Ga4OAuthService implements ChannelOAuthService {
  readonly urlChannel = 'ga4';
  private readonly logger = new Logger(Ga4OAuthService.name);

  constructor(private readonly config: ConfigService) {}

  private buildOAuthClient() {
    return new google.auth.OAuth2({
      clientId: this.config.getOrThrow<string>('GA4_CLIENT_ID'),
      clientSecret: this.config.getOrThrow<string>('GA4_CLIENT_SECRET'),
      redirectUri: this.config.getOrThrow<string>('GA4_REDIRECT_URI'),
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
      throw new Error('GA4 OAuth: missing access_token');
    }
    oauth2.setCredentials(tokens);

    const admin = google.analyticsadmin({ version: 'v1beta', auth: oauth2 });
    const accountsResp = await admin.accounts.list();
    const accounts = accountsResp.data.accounts ?? [];

    const results: OAuthAccountResult[] = [];
    for (const acc of accounts) {
      const accountId = acc.name?.replace('accounts/', '') ?? '';
      const propsResp = await admin.properties.list({
        filter: `parent:${acc.name}`,
      });
      const properties = propsResp.data.properties ?? [];
      for (const prop of properties) {
        const propertyId = prop.name?.replace('properties/', '') ?? '';
        results.push({
          channel: ChannelEnum.ga4,
          accountId: propertyId,
          accountHandle: prop.displayName ?? propertyId,
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token ?? undefined,
          expiresAt: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : undefined,
          scopes: SCOPES,
          metadata: {
            accountId,
            accountDisplayName: acc.displayName ?? null,
            propertyId,
            propertyName: prop.displayName ?? null,
            timeZone: prop.timeZone ?? null,
            currencyCode: prop.currencyCode ?? null,
            industryCategory: prop.industryCategory ?? null,
            createTime: prop.createTime ?? null,
          },
        });
      }
    }

    if (!results.length) {
      this.logger.warn(
        'GA4 OAuth completed but user has no accessible properties',
      );
    }
    return results;
  }
}
