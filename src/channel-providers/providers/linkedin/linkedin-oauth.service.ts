import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ChannelEnum } from '../../../connections/domain/channel.enum';
import {
  ChannelOAuthService,
  OAuthAccountResult,
} from '../../../oauth/oauth-provider.interface';

const AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const API_BASE = 'https://api.linkedin.com/v2';

const SCOPES = [
  'r_organization_social',
  'rw_organization_admin',
  'w_organization_social',
];

@Injectable()
export class LinkedinOAuthService implements ChannelOAuthService {
  readonly urlChannel = 'linkedin';
  private readonly logger = new Logger(LinkedinOAuthService.name);

  constructor(private readonly config: ConfigService) {}

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.getOrThrow<string>('LINKEDIN_CLIENT_ID'),
      redirect_uri: this.config.getOrThrow<string>('LINKEDIN_REDIRECT_URI'),
      state,
      scope: SCOPES.join(' '),
    });
    return `${AUTH_URL}?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<OAuthAccountResult[]> {
    const clientId = this.config.getOrThrow<string>('LINKEDIN_CLIENT_ID');
    const clientSecret = this.config.getOrThrow<string>(
      'LINKEDIN_CLIENT_SECRET',
    );
    const redirectUri = this.config.getOrThrow<string>('LINKEDIN_REDIRECT_URI');

    // 1) Exchange code → access_token
    const { data: tokenResp } = await axios.post<{
      access_token: string;
      expires_in: number;
      refresh_token?: string;
    }>(
      TOKEN_URL,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    const accessToken = tokenResp.access_token;
    const expiresAt = new Date(Date.now() + tokenResp.expires_in * 1000);

    // 2) Listar organizations donde el usuario es ADMINISTRATOR
    const { data: aclResp } = await axios.get<{
      elements: Array<{
        organizationalTarget: string;
        role: string;
        state: string;
      }>;
    }>(
      `${API_BASE}/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      },
    );

    const orgUrns = aclResp.elements.map((e) => e.organizationalTarget);
    if (!orgUrns.length) {
      this.logger.warn(
        'LinkedIn OAuth completed but user is not admin of any organization',
      );
      return [];
    }

    // 3) Detalles de cada organization
    const results: OAuthAccountResult[] = [];
    for (const urn of orgUrns) {
      const orgId = urn.replace('urn:li:organization:', '');
      try {
        const { data: orgData } = await axios.get<{
          id: number;
          localizedName: string;
          vanityName?: string;
        }>(`${API_BASE}/organizations/${orgId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        results.push({
          channel: ChannelEnum.linkedin,
          accountId: String(orgData.id),
          accountHandle: orgData.localizedName,
          accessToken,
          refreshToken: tokenResp.refresh_token,
          expiresAt,
          scopes: SCOPES,
          metadata: {
            organizationUrn: urn,
            organizationId: orgData.id,
            organizationName: orgData.localizedName,
            vanityName: orgData.vanityName ?? null,
          },
        });
      } catch (err) {
        const e = err as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        this.logger.warn(
          `Skipping LinkedIn org ${urn}: ${e.response?.data?.message ?? e.message}`,
        );
      }
    }

    return results;
  }
}
