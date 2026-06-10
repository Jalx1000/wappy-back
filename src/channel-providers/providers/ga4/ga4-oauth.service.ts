import { Injectable } from '@nestjs/common';
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
    const oauth2Client = this.createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const accessToken = tokens.access_token!;
    const refreshToken = tokens.refresh_token ?? undefined;
    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000);

    const analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth: oauth2Client });
    const propsRes = await analyticsAdmin.properties.list({
      filter: 'parent:accounts/-',
    });

    const properties = propsRes.data.properties ?? [];
    if (properties.length === 0) {
      throw new Error('No GA4 properties found for this Google account');
    }

    return properties.map((prop) => ({
      channel: ChannelEnum.ga4,
      accountId: (prop.name ?? '').replace('properties/', ''),
      accountHandle: prop.displayName ?? prop.name ?? '',
      accessToken,
      refreshToken,
      expiresAt,
      scopes: SCOPES,
      metadata: { propertyName: prop.name },
    }));
  }

  private createOAuth2Client() {
    return new google.auth.OAuth2(
      this.config.getOrThrow<string>('GA4_CLIENT_ID'),
      this.config.getOrThrow<string>('GA4_CLIENT_SECRET'),
      this.config.getOrThrow<string>('GA4_REDIRECT_URI'),
    );
  }
}
