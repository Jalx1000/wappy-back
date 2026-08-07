import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Connection } from '../connections/domain/connection';
import { EncryptionService } from '../encryption/encryption.service';
import { metaGraphError } from './meta-graph-error';

// Sends Facebook Messenger (Page) messages through the Graph API:
//   POST graph.facebook.com/<page-id>/messages
// using the Page access token stored on the connection. The 24h standard
// messaging window applies: free-form replies only succeed within 24h of the
// user's last message (or with a permitted message tag). We surface Meta's error
// rather than hide it.
@Injectable()
export class MessengerSendService {
  private readonly logger = new Logger(MessengerSendService.name);

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

  /** Sends a text message and returns the Messenger message id (mid). */
  async sendText(
    connection: Connection,
    recipientPsid: string,
    body: string,
  ): Promise<string> {
    try {
      const { data } = await axios.post<{ message_id?: string }>(
        `${this.graphUrl}/${connection.accountId}/messages`,
        {
          recipient: { id: recipientPsid },
          messaging_type: 'RESPONSE',
          message: { text: body },
        },
        { headers: { Authorization: `Bearer ${this.token(connection)}` } },
      );
      const mid = data?.message_id;
      if (!mid) {
        throw new BadGatewayException('Messenger send returned no message id');
      }
      return mid;
    } catch (err) {
      throw metaGraphError(this.logger, err, 'Messenger send failed');
    }
  }
}
