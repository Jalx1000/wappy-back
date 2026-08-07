import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Connection } from '../connections/domain/connection';
import { ChannelEnum } from '../connections/domain/channel.enum';
import { EncryptionService } from '../encryption/encryption.service';
import { metaGraphError } from './meta-graph-error';

// Sends Instagram Direct messages through the Graph API. Two transports:
//  - `instagram` (IG business account linked to a Facebook Page): graph.facebook.com
//  - `instagram_login` (Instagram API with Instagram Login): graph.instagram.com
// Both use the Messenger-style body `{ recipient, message }`. The 24h messaging
// window applies: free-form replies only succeed within 24h of the user's last
// message (or with a permitted tag). We surface Meta's error rather than hide it.
@Injectable()
export class InstagramSendService {
  private readonly logger = new Logger(InstagramSendService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly encryption: EncryptionService,
  ) {}

  private graphUrl(connection: Connection): string {
    const v = this.config.get<string>('META_GRAPH_VERSION', 'v25.0');
    const host =
      connection.channel === ChannelEnum.instagram_login
        ? 'https://graph.instagram.com'
        : 'https://graph.facebook.com';
    return `${host}/${v}`;
  }

  private token(connection: Connection): string {
    return this.encryption.decryptSafe(connection.accessToken);
  }

  /** Sends a text DM and returns the Instagram message id (mid). */
  async sendText(
    connection: Connection,
    recipientIgsid: string,
    body: string,
  ): Promise<string> {
    // `messaging_type` is a Messenger-Platform field understood only by the
    // Facebook-Page transport (graph.facebook.com). The Instagram-Login
    // transport (graph.instagram.com) rejects the extra field, so we only add
    // it for the page-linked `instagram` channel.
    const payload: Record<string, unknown> = {
      recipient: { id: recipientIgsid },
      message: { text: body },
    };
    if (connection.channel !== ChannelEnum.instagram_login) {
      payload.messaging_type = 'RESPONSE';
    }

    try {
      const { data } = await axios.post<{ message_id?: string }>(
        `${this.graphUrl(connection)}/${connection.accountId}/messages`,
        payload,
        { headers: { Authorization: `Bearer ${this.token(connection)}` } },
      );
      const mid = data?.message_id;
      if (!mid) {
        throw new BadGatewayException('Instagram send returned no message id');
      }
      return mid;
    } catch (err) {
      throw metaGraphError(this.logger, err, 'Instagram send failed');
    }
  }
}
