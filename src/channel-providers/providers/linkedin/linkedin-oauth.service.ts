import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ChannelEnum } from '../../../connections/domain/channel.enum';
import {
  ChannelOAuthService,
  OAuthAccountResult,
} from '../../../oauth/oauth-provider.interface';

const TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const API_BASE = 'https://api.linkedin.com/v2';
const SCOPES = [
  'r_liteprofile',
  'r_organization_social',
  'rw_organization_admin',
  'offline_access',
];

interface OrgAcl {
  organization: string;
}

@Injectable()
export class LinkedinOAuthService implements ChannelOAuthService {
  readonly urlChannel = 'linkedin';

  constructor(private readonly config: ConfigService) {}

  getAuthorizationUrl(state: string): string {
    const clientId = this.config.getOrThrow<string>('LINKEDIN_CLIENT_ID');
    const redirectUri = this.config.getOrThrow<string>('LINKEDIN_REDIRECT_URI');
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: SCOPES.join(' '),
      state,
    });
    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<OAuthAccountResult[]> {
    const clientId = this.config.getOrThrow<string>('LINKEDIN_CLIENT_ID');
    const clientSecret = this.config.getOrThrow<string>('LINKEDIN_CLIENT_SECRET');
    const redirectUri = this.config.getOrThrow<string>('LINKEDIN_REDIRECT_URI');

    const { data: tokenData } = await axios.post<Record<string, unknown>>(
      TOKEN_URL,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    if (tokenData['error']) {
      throw new Error(
        `LinkedIn token exchange: ${(tokenData['error_description'] as string) ?? String(tokenData['error'])}`,
      );
    }

    const accessToken = tokenData['access_token'] as string;
    const refreshToken = tokenData['refresh_token'] as string | undefined;
    const expiresIn = tokenData['expires_in'] as number;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const { data: aclData } = await axios.get<Record<string, unknown>>(
      `${API_BASE}/organizationAcls?q=roleAssignee&role=ADMINISTRATOR`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    const elements: OrgAcl[] = (aclData['elements'] as OrgAcl[]) ?? [];
    if (elements.length === 0) return [];

    const results: OAuthAccountResult[] = [];
    for (const acl of elements) {
      const orgId = acl.organization.split(':').pop() ?? acl.organization;
      const { data: orgData } = await axios.get<Record<string, unknown>>(
        `${API_BASE}/organizations/${orgId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      results.push({
        channel: ChannelEnum.linkedin,
        accountId: orgId,
        accountHandle: (orgData['localizedName'] as string) ?? orgId,
        accessToken,
        refreshToken,
        expiresAt,
        scopes: SCOPES,
        metadata: { urn: acl.organization, orgId },
      });
    }
    return results;
  }
}
