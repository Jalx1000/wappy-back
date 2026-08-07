import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';
import { Connection } from '../connections/domain/connection';
import { EncryptionService } from '../encryption/encryption.service';
import { metaGraphError } from './meta-graph-error';

export type WhatsappMediaType =
  | 'image'
  | 'audio'
  | 'video'
  | 'document'
  | 'sticker';

export interface SendLocationInput {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface UploadFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

// Sends messages through WhatsApp Cloud API. Note the 24h customer service
// window: free-form messages only succeed if the user messaged the business
// within the last 24h (via Cloud API); otherwise Meta rejects it and a template
// is required. We surface Meta's error rather than swallowing it.
@Injectable()
export class WhatsappSendService {
  private readonly logger = new Logger(WhatsappSendService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly encryption: EncryptionService,
  ) {}

  private get graphUrl(): string {
    const v = this.config.get<string>('META_GRAPH_VERSION', 'v25.0');
    return `https://graph.facebook.com/${v}`;
  }

  private token(connection: Connection): string {
    return this.encryption.decryptSafe(connection.accessToken);
  }

  /** Sends a text message and returns the WhatsApp message id (wamid). */
  async sendText(
    connection: Connection,
    to: string,
    body: string,
  ): Promise<string> {
    return this.postMessage(connection, { to, type: 'text', text: { body } });
  }

  /** Sends a location message. */
  async sendLocation(
    connection: Connection,
    to: string,
    loc: SendLocationInput,
  ): Promise<string> {
    return this.postMessage(connection, {
      to,
      type: 'location',
      location: {
        latitude: loc.latitude,
        longitude: loc.longitude,
        ...(loc.name ? { name: loc.name } : {}),
        ...(loc.address ? { address: loc.address } : {}),
      },
    });
  }

  /**
   * Uploads a file to Graph and returns its media id (reusable to send it).
   * Cloud API requires media to be uploaded (or reachable by public link)
   * before sending.
   */
  async uploadMedia(connection: Connection, file: UploadFile): Promise<string> {
    const form = new FormData();
    form.append('messaging_product', 'whatsapp');
    form.append('type', file.mimetype);
    form.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    try {
      const { data } = await axios.post<{ id?: string }>(
        `${this.graphUrl}/${connection.accountId}/media`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${this.token(connection)}`,
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        },
      );
      if (!data.id) {
        throw new BadGatewayException('Media upload returned no id');
      }
      return data.id;
    } catch (err) {
      throw metaGraphError(this.logger, err, 'Media upload failed');
    }
  }

  /** Sends a previously-uploaded media asset by id. */
  async sendMedia(
    connection: Connection,
    to: string,
    type: WhatsappMediaType,
    opts: { mediaId: string; caption?: string; filename?: string },
  ): Promise<string> {
    const captionable =
      type === 'image' || type === 'video' || type === 'document';
    const media: Record<string, unknown> = { id: opts.mediaId };
    if (captionable && opts.caption) media.caption = opts.caption;
    if (type === 'document' && opts.filename) media.filename = opts.filename;

    return this.postMessage(connection, { to, type, [type]: media });
  }

  private async postMessage(
    connection: Connection,
    body: Record<string, unknown>,
  ): Promise<string> {
    try {
      const { data } = await axios.post<{ messages?: Array<{ id?: string }> }>(
        `${this.graphUrl}/${connection.accountId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          ...body,
        },
        { headers: { Authorization: `Bearer ${this.token(connection)}` } },
      );
      const wamid = data?.messages?.[0]?.id;
      if (!wamid) {
        throw new BadGatewayException('WhatsApp send returned no message id');
      }
      return wamid;
    } catch (err) {
      throw metaGraphError(this.logger, err, 'WhatsApp send failed');
    }
  }
}
