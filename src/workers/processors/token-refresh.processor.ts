import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_TOKENS } from '../../queues/queue-names.constants';
import { ConnectionsRepository } from '../../connections/infrastructure/persistence/relational/repositories/connections.repository';
import { EncryptionService } from '../../encryption/encryption.service';
import { CHANNEL_PROVIDERS } from '../../channel-providers/channel-providers.module';
import { ChannelProvider } from '../../channel-providers/channel-provider.interface';
import { Connection } from '../../connections/domain/connection';
import { ConnectionStatusEnum } from '../../connections/domain/connection-status.enum';

interface TokenRefreshPayload {
  connectionId?: number;
}

// Refresh tokens expiring within 48 hours
const REFRESH_LOOKAHEAD_MS = 48 * 60 * 60 * 1000;

@Processor(QUEUE_TOKENS)
export class TokenRefreshProcessor extends WorkerHost {
  private readonly logger = new Logger(TokenRefreshProcessor.name);

  constructor(
    private readonly connectionsRepo: ConnectionsRepository,
    private readonly encryptionService: EncryptionService,
    @Inject(CHANNEL_PROVIDERS) private readonly providers: ChannelProvider[],
  ) {
    super();
  }

  async process(job: Job<TokenRefreshPayload>): Promise<void> {
    const { connectionId } = job.data;

    if (connectionId) {
      await this.refreshOne(connectionId);
    } else {
      await this.refreshExpiring();
    }
  }

  private async refreshExpiring(): Promise<void> {
    const cutoff = new Date(Date.now() + REFRESH_LOOKAHEAD_MS);
    const connections = await this.connectionsRepo.findExpiring(cutoff);
    this.logger.log(`Found ${connections.length} connection(s) expiring before ${cutoff.toISOString()}`);

    await Promise.allSettled(
      connections.map((c) => this.refreshOne(c.id)),
    );
  }

  private async refreshOne(connectionId: number): Promise<void> {
    const connection = await this.connectionsRepo.findById(connectionId);
    if (!connection) {
      this.logger.warn(`Token refresh: connection ${connectionId} not found`);
      return;
    }

    const provider = this.providers.find((p) => p.channel === connection.channel);
    if (!provider) {
      this.logger.warn(`No provider for channel ${connection.channel}, skipping token refresh`);
      return;
    }

    const decrypted = this.decryptTokens(connection);

    try {
      const tokens = await provider.refreshToken(decrypted);

      await this.connectionsRepo.update(connectionId, {
        accessToken: this.encryptionService.encrypt(tokens.accessToken),
        refreshToken: tokens.refreshToken
          ? this.encryptionService.encrypt(tokens.refreshToken)
          : connection.refreshToken,
        expiresAt: tokens.expiresAt ?? connection.expiresAt,
        status: ConnectionStatusEnum.connected,
      });

      this.logger.log(`Refreshed token for connection ${connectionId}`);
    } catch (err) {
      this.logger.error(`Token refresh failed for connection ${connectionId}`, err);
      await this.connectionsRepo.updateStatus(connectionId, ConnectionStatusEnum.expired);
    }
  }

  private decryptTokens(connection: Connection): Connection {
    const decrypted = Object.assign(new Connection(), connection);
    try {
      decrypted.accessToken = this.encryptionService.decrypt(connection.accessToken);
    } catch {
      decrypted.accessToken = connection.accessToken;
    }
    if (connection.refreshToken) {
      try {
        decrypted.refreshToken = this.encryptionService.decrypt(connection.refreshToken);
      } catch {
        decrypted.refreshToken = connection.refreshToken;
      }
    }
    return decrypted;
  }
}
