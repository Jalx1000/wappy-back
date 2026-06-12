import { Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(YoutubeOAuthService.name);

  constructor(private readonly config: ConfigService) {}

  private buildOAuthClient() {
    return new google.auth.OAuth2({
      clientId: this.config.getOrThrow<string>('YOUTUBE_CLIENT_ID'),
      clientSecret: this.config.getOrThrow<string>('YOUTUBE_CLIENT_SECRET'),
      redirectUri: this.config.getOrThrow<string>('YOUTUBE_REDIRECT_URI'),
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
      throw new Error('YouTube OAuth: missing access_token');
    }
    oauth2.setCredentials(tokens);

    const youtube = google.youtube({ version: 'v3', auth: oauth2 });
    const channelsResp = await youtube.channels.list({
      part: ['id', 'snippet', 'statistics'],
      mine: true,
    });

    const channels = channelsResp.data.items ?? [];
    if (!channels.length) {
      this.logger.warn(
        'YouTube OAuth completed but user has no accessible YouTube channels',
      );
      return [];
    }

    return channels.map((ch) => ({
      channel: ChannelEnum.youtube,
      accountId: ch.id!,
      accountHandle: ch.snippet?.title ?? ch.id!,
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token ?? undefined,
      expiresAt: tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : undefined,
      scopes: SCOPES,
      metadata: {
        channelId: ch.id,
        channelTitle: ch.snippet?.title,
        customUrl: ch.snippet?.customUrl ?? null,
        description: ch.snippet?.description ?? null,
        thumbnailUrl: ch.snippet?.thumbnails?.default?.url ?? null,
        subscriberCount: ch.statistics?.subscriberCount ?? null,
        videoCount: ch.statistics?.videoCount ?? null,
        viewCount: ch.statistics?.viewCount ?? null,
      },
    }));
  }
}
