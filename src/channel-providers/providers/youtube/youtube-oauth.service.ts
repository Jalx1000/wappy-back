import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { ChannelEnum } from '../../../connections/domain/channel.enum';
import {
  ChannelOAuthService,
  OAuthAccountResult,
} from '../../../oauth/oauth-provider.interface';

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
];

@Injectable()
export class YoutubeOAuthService implements ChannelOAuthService {
  readonly urlChannel = 'youtube';

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

    const yt = google.youtube({ version: 'v3', auth: oauth2Client });
    const channelsRes = await yt.channels.list({ part: ['snippet'], mine: true });

    const items = channelsRes.data.items ?? [];
    if (items.length === 0) {
      throw new Error('No YouTube channel found for this Google account');
    }

    return items.map((item) => ({
      channel: ChannelEnum.youtube,
      accountId: item.id!,
      accountHandle: item.snippet?.title ?? item.id!,
      accessToken,
      refreshToken,
      expiresAt,
      scopes: SCOPES,
      metadata: { channelId: item.id },
    }));
  }

  private createOAuth2Client() {
    return new google.auth.OAuth2(
      this.config.getOrThrow<string>('YOUTUBE_CLIENT_ID'),
      this.config.getOrThrow<string>('YOUTUBE_CLIENT_SECRET'),
      this.config.getOrThrow<string>('YOUTUBE_REDIRECT_URI'),
    );
  }
}
