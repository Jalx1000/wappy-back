import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ChannelEnum } from '../../../connections/domain/channel.enum';
import { Connection } from '../../../connections/domain/connection';
import {
  ChannelProvider,
  DateRange,
  MetricRow,
  PostData,
  TokenData,
} from '../../channel-provider.interface';

const TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';

@Injectable()
export class LinkedinProvider implements ChannelProvider {
  readonly channel = ChannelEnum.linkedin;

  constructor(private readonly config: ConfigService) {}

  // async to satisfy the ChannelProvider interface; stub has no awaited I/O yet
  // eslint-disable-next-line @typescript-eslint/require-await
  async fetchMetrics(
    _connection: Connection,
    _dateRange: DateRange,
  ): Promise<MetricRow[]> {
    this.ensureConfigured();
    // LinkedIn Organization Analytics API requires partner-level API access.
    return [];
  }

  // async to satisfy the ChannelProvider interface; stub has no awaited I/O yet
  // eslint-disable-next-line @typescript-eslint/require-await
  async fetchPosts(
    _connection: Connection,
    _dateRange: DateRange,
  ): Promise<PostData[]> {
    this.ensureConfigured();
    return [];
  }

  async refreshToken(connection: Connection): Promise<TokenData> {
    this.ensureConfigured();
    if (!connection.refreshToken) {
      throw new Error(
        'LinkedIn: no refresh token available for this connection',
      );
    }
    const clientId = this.config.getOrThrow<string>('LINKEDIN_CLIENT_ID');
    const clientSecret = this.config.getOrThrow<string>(
      'LINKEDIN_CLIENT_SECRET',
    );

    const { data } = await axios.post<Record<string, unknown>>(
      TOKEN_URL,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: connection.refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    if (data['error']) {
      throw new Error(
        `LinkedIn token refresh: ${(data['error_description'] as string) ?? String(data['error'])}`,
      );
    }

    return {
      accessToken: data['access_token'] as string,
      refreshToken: data['refresh_token'] as string | undefined,
      expiresAt: new Date(Date.now() + (data['expires_in'] as number) * 1000),
    };
  }

  private ensureConfigured(): void {
    if (!this.config.get<string>('LINKEDIN_CLIENT_ID')) {
      throw new Error(
        'LinkedIn credentials not configured (LINKEDIN_CLIENT_ID missing)',
      );
    }
  }
}
