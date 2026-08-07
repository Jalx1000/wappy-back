import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const GRAPH_VERSION_DEFAULT = 'v25.0';

// Page webhook fields we need for the Messenger inbox: inbound messages, button
// postbacks, reactions, read receipts, and echoes of messages the Page sends
// from other tools (so multi-agent threads stay in sync).
const SUBSCRIBED_FIELDS = [
  'messages',
  'messaging_postbacks',
  'message_reactions',
  'message_reads',
  'message_echoes',
].join(',');

/**
 * Subscribes our Facebook app to a Page's webhook events
 * (POST /{page-id}/subscribed_apps), so Messenger conversations start flowing to
 * /webhooks/messenger without a manual step in the App Dashboard. Best-effort:
 * a failure never blocks connecting the Page (the user can retry or subscribe in
 * the console). Requires the Page token to carry `pages_manage_metadata`.
 */
@Injectable()
export class MetaPageSubscriptionService {
  private readonly logger = new Logger(MetaPageSubscriptionService.name);

  constructor(private readonly config: ConfigService) {}

  private get graphUrl(): string {
    const v = this.config.get<string>(
      'META_GRAPH_VERSION',
      GRAPH_VERSION_DEFAULT,
    );
    return `https://graph.facebook.com/${v}`;
  }

  /** Best-effort subscribe of the app to a Page's Messenger webhooks. */
  async subscribePage(pageId: string, pageToken: string): Promise<boolean> {
    try {
      await axios.post(
        `${this.graphUrl}/${pageId}/subscribed_apps`,
        {},
        {
          params: { subscribed_fields: SUBSCRIBED_FIELDS },
          headers: { Authorization: `Bearer ${pageToken}` },
        },
      );
      this.logger.log(`Subscribed app to Page ${pageId} (Messenger webhooks)`);
      return true;
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? ((err.response?.data as { error?: { message?: string } })?.error
            ?.message ?? err.message)
        : String(err);
      // Non-fatal: the connection is still created; the user can retry the
      // subscription or configure it in the Meta console.
      this.logger.warn(`Could not subscribe app to Page ${pageId}: ${msg}`);
      return false;
    }
  }
}
