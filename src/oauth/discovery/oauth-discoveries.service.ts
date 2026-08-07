import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OAuthDiscoveriesRepository } from './infrastructure/persistence/relational/repositories/oauth-discoveries.repository';
import {
  OAuthDiscovery,
  OAuthDiscoveryAccount,
} from './domain/oauth-discovery';
import { ConnectionsService } from '../../connections/connections.service';
import { OrphanAccountsRepository } from '../../connections/orphan/infrastructure/persistence/relational/repositories/orphan-accounts.repository';
import { OrphanAccount } from '../../connections/orphan/domain/orphan-account';
import { EncryptionService } from '../../encryption/encryption.service';
import { OAuthAccountResult } from '../oauth-provider.interface';
import { DiscoveryAssignmentDto } from './dto/assign-discovery.dto';
import { ChannelEnum } from '../../connections/domain/channel.enum';
import { MetaPageSubscriptionService } from '../../channel-providers/providers/meta/meta-page-subscription.service';

export interface AssignDiscoveryResult {
  connectionsCreated: number;
  orphansCreated: number;
}

@Injectable()
export class OAuthDiscoveriesService {
  private readonly logger = new Logger(OAuthDiscoveriesService.name);

  constructor(
    private readonly repo: OAuthDiscoveriesRepository,
    private readonly connectionsService: ConnectionsService,
    private readonly orphansRepo: OrphanAccountsRepository,
    private readonly encryption: EncryptionService,
    private readonly pageSubscription: MetaPageSubscriptionService,
  ) {}

  async getForUser(id: number, userId: number): Promise<OAuthDiscovery> {
    const d = await this.repo.findByIdForUser(id, userId);
    if (!d) throw new NotFoundException(`Discovery #${id} not found`);
    if (d.consumedAt)
      throw new BadRequestException('Discovery already consumed');
    if (d.expiresAt < new Date())
      throw new BadRequestException('Discovery expired');
    return d;
  }

  /**
   * Returns the discovery in a UI-friendly shape (no tokens, no secrets).
   */
  toPublicView(d: OAuthDiscovery) {
    return {
      id: d.id,
      channel: d.channel,
      triggeredBrandId: d.triggeredBrandId,
      expiresAt: d.expiresAt,
      accounts: d.accounts.map((a) => ({
        channel: a.channel,
        accountId: a.accountId,
        accountHandle: a.accountHandle,
        scopes: a.scopes,
        metadata: a.metadata,
      })),
    };
  }

  async assign(
    id: number,
    userId: number,
    assignments: DiscoveryAssignmentDto[],
  ): Promise<AssignDiscoveryResult> {
    const discovery = await this.getForUser(id, userId);

    const accountById = new Map(
      discovery.accounts.map((a) => [a.accountId, a]),
    );

    let connectionsCreated = 0;
    let orphansCreated = 0;

    for (const assignment of assignments) {
      const acc = accountById.get(assignment.accountId);
      if (!acc) {
        this.logger.warn(
          `assign discovery ${id}: accountId ${assignment.accountId} not in discovery`,
        );
        continue;
      }

      const oauthResult = this.toOAuthAccountResult(acc);

      if (assignment.brandId != null) {
        await this.connectionsService.upsertFromOAuth(
          assignment.brandId,
          oauthResult,
        );
        connectionsCreated++;

        // Facebook Pages: subscribe the app to the Page's Messenger webhooks so
        // DMs start flowing to /webhooks/messenger without a manual dashboard
        // step. Best-effort — never blocks the connection. `accessToken` here is
        // the decrypted Page token (needs pages_manage_metadata).
        if (acc.channel === ChannelEnum.facebook_page) {
          await this.pageSubscription.subscribePage(
            oauthResult.accountId,
            oauthResult.accessToken,
          );
        }
      } else {
        const orphan = new OrphanAccount();
        orphan.channel = acc.channel;
        orphan.accountId = acc.accountId;
        orphan.accountHandle = acc.accountHandle;
        // tokens in discovery are encrypted; orphan stores encrypted too,
        // so we pass through directly.
        orphan.accessToken = acc.accessToken;
        orphan.refreshToken = acc.refreshToken ?? null;
        orphan.expiresAt = acc.expiresAt ? new Date(acc.expiresAt) : null;
        orphan.scopes = acc.scopes;
        orphan.metadata = acc.metadata;
        orphan.discoveredByUserId = userId;
        await this.orphansRepo.upsert(orphan);
        orphansCreated++;
      }
    }

    await this.repo.markConsumed(id);
    this.logger.log(
      `assign discovery ${id}: ${connectionsCreated} connections + ${orphansCreated} orphans`,
    );
    return { connectionsCreated, orphansCreated };
  }

  /**
   * Convert a stored discovery account (encrypted tokens) into the OAuth
   * result shape expected by ConnectionsService.upsertFromOAuth (which
   * re-encrypts internally). We decrypt here to round-trip cleanly.
   */
  private toOAuthAccountResult(acc: OAuthDiscoveryAccount): OAuthAccountResult {
    const decryptedAccess = this.safeDecrypt(acc.accessToken);
    const decryptedRefresh = acc.refreshToken
      ? this.safeDecrypt(acc.refreshToken)
      : undefined;
    return {
      channel: acc.channel,
      accountId: acc.accountId,
      accountHandle: acc.accountHandle,
      accessToken: decryptedAccess,
      refreshToken: decryptedRefresh,
      expiresAt: acc.expiresAt ? new Date(acc.expiresAt) : undefined,
      scopes: acc.scopes,
      metadata: acc.metadata,
    };
  }

  private safeDecrypt(value: string): string {
    try {
      return this.encryption.decrypt(value);
    } catch {
      throw new ForbiddenException('Failed to decrypt stored token');
    }
  }
}
