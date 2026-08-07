import {
  BadGatewayException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ConnectionsRepository } from '../connections/infrastructure/persistence/relational/repositories/connections.repository';
import { EncryptionService } from '../encryption/encryption.service';
import { WhatsappMessageRepository } from '../whatsapp-messages/infrastructure/persistence/whatsapp-message.repository';

export interface FetchedMedia {
  buffer: Buffer;
  mimeType: string;
  filename?: string;
}

// Proxies WhatsApp media so the browser can render it: Graph returns a
// short-lived download URL on lookaside.fbsbx.com that requires the business
// token, so the browser can't fetch it directly. We resolve + download here and
// stream the bytes back. Brand-scoped via the message → connection.
@Injectable()
export class WhatsappMediaService {
  private readonly logger = new Logger(WhatsappMediaService.name);

  constructor(
    private readonly messagesRepo: WhatsappMessageRepository,
    private readonly connectionsRepo: ConnectionsRepository,
    private readonly encryption: EncryptionService,
    private readonly config: ConfigService,
  ) {}

  private get graphUrl(): string {
    const v = this.config.get<string>('META_GRAPH_VERSION', 'v25.0');
    return `https://graph.facebook.com/${v}`;
  }

  async fetch(brandId: number, messageId: string): Promise<FetchedMedia> {
    const message = await this.messagesRepo.findById(messageId);
    if (!message || !message.mediaId) {
      throw new NotFoundException('Media not found');
    }
    const connection = await this.connectionsRepo.findById(
      message.connectionId,
    );
    // Do not serve media for another brand's message.
    if (!connection || connection.brandId !== brandId) {
      throw new NotFoundException('Media not found');
    }

    const token = this.encryption.decryptSafe(connection.accessToken);
    const filename =
      (message.payload as { filename?: string } | null)?.filename ?? undefined;

    try {
      // 1) media id → short-lived download URL + mime type
      const { data: meta } = await axios.get<{
        url?: string;
        mime_type?: string;
      }>(`${this.graphUrl}/${message.mediaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!meta.url) {
        throw new BadGatewayException('Media lookup returned no url');
      }
      // 2) download the bytes (the lookaside URL also needs the token)
      const { data } = await axios.get<ArrayBuffer>(meta.url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer',
      });
      return {
        buffer: Buffer.from(data),
        mimeType: meta.mime_type ?? 'application/octet-stream',
        filename,
      };
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? ((err.response?.data as { error?: { message?: string } })?.error
            ?.message ?? err.message)
        : String(err);
      this.logger.warn(
        `WhatsApp media fetch failed (${message.mediaId}): ${msg}`,
      );
      throw new BadGatewayException(msg);
    }
  }
}
