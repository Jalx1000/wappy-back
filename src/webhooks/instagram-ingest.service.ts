import { Injectable, Logger } from '@nestjs/common';
import { ConnectionsRepository } from '../connections/infrastructure/persistence/relational/repositories/connections.repository';
import { ChannelEnum } from '../connections/domain/channel.enum';
import { Connection } from '../connections/domain/connection';
import { ContactsService } from '../contacts/contacts.service';
import { InstagramConversationRepository } from '../instagram-conversations/infrastructure/persistence/instagram-conversation.repository';
import { InstagramConversation } from '../instagram-conversations/domain/instagram-conversation';
import { InstagramMessageRepository } from '../instagram-messages/infrastructure/persistence/instagram-message.repository';
import { IgMessagingItem } from './instagram-webhook.service';

/**
 * Persists Instagram Direct webhook events into the central contact model and
 * the instagram_conversation / instagram_message tables. Every IG user is
 * resolved to a central Contact via ContactsService.upsertIdentity, so the
 * unified inbox works across channels (same pattern as WhatsappIngestService).
 */
@Injectable()
export class InstagramIngestService {
  private readonly logger = new Logger(InstagramIngestService.name);

  constructor(
    private readonly connectionsRepo: ConnectionsRepository,
    private readonly contactsService: ContactsService,
    private readonly conversationsRepo: InstagramConversationRepository,
    private readonly messagesRepo: InstagramMessageRepository,
  ) {}

  /** Handles one entry[].messaging[] item (a DM, an echo of ours, a reaction…). */
  async handleMessaging(
    entryId: string | undefined,
    item: IgMessagingItem,
  ): Promise<void> {
    // Our IG account is the recipient for inbound, or the sender for echoes.
    const isEcho = item.message?.is_echo === true;
    const ourAccountId = isEcho
      ? item.sender?.id
      : (item.recipient?.id ?? entryId);
    const peerId = isEcho ? item.recipient?.id : item.sender?.id;

    if (!peerId) {
      this.logger.debug('Instagram ingest: event without a peer id, skipping');
      return;
    }

    const connection = await this.resolveConnection(ourAccountId);
    if (!connection) {
      this.logger.warn(
        `Instagram ingest: no connection for ig account=${ourAccountId ?? '-'}`,
      );
      return;
    }

    // Reactions arrive as their own event; store as a lightweight message.
    if (item.reaction) {
      const conversation = await this.resolveConversation(connection, peerId);
      await this.persist(connection, conversation, {
        externalId: `${item.reaction.mid ?? peerId}:${item.reaction.action ?? 'react'}`,
        direction: isEcho ? 'out' : 'in',
        messageType: 'reaction',
        content: item.reaction.emoji ?? null,
        payload: { reaction: item.reaction },
        timestamp: item.timestamp,
      });
      return;
    }

    const message = item.message;
    if (!message?.mid) {
      this.logger.debug('Instagram ingest: non-message event, skipping');
      return;
    }

    const conversation = await this.resolveConversation(connection, peerId);
    const { content, mediaUrl, messageType, payload } =
      this.extractContent(message);

    await this.persist(connection, conversation, {
      externalId: message.mid,
      direction: isEcho ? 'out' : 'in',
      messageType,
      content,
      mediaUrl,
      payload,
      timestamp: item.timestamp,
    });
  }

  private async resolveConnection(
    igAccountId: string | undefined,
  ): Promise<Connection | null> {
    if (!igAccountId) return null;
    // IG can be connected via a Facebook Page (channel `instagram`) or via
    // Instagram Login (channel `instagram_login`); the account id is the same
    // key in either case.
    for (const channel of [
      ChannelEnum.instagram,
      ChannelEnum.instagram_login,
    ]) {
      const matches = await this.connectionsRepo.findByChannelAndAccount(
        channel,
        igAccountId,
      );
      if (matches[0]) return matches[0];
    }
    return null;
  }

  private async resolveConversation(
    connection: Connection,
    igUserId: string,
  ): Promise<InstagramConversation> {
    const existing = await this.conversationsRepo.findByConnectionAndUser(
      connection.id,
      igUserId,
    );
    if (existing) return existing;

    // New thread → resolve/create the central contact first.
    const { contact } = await this.contactsService.upsertIdentity({
      brandId: connection.brandId,
      channel: connection.channel,
      connectionId: connection.id,
      externalId: igUserId,
    });

    return this.conversationsRepo.create({
      connectionId: connection.id,
      igUserId,
      contactId: contact.id,
      peerUsername: null,
      lastMessageAt: null,
    });
  }

  private async persist(
    connection: Connection,
    conversation: InstagramConversation,
    m: {
      externalId: string;
      direction: 'in' | 'out';
      messageType: string;
      content: string | null;
      mediaUrl?: string | null;
      payload?: Record<string, unknown> | null;
      timestamp?: number;
    },
  ): Promise<void> {
    const existing = await this.messagesRepo.findByConnectionAndExternalId(
      connection.id,
      m.externalId,
    );
    if (existing) return; // idempotent

    const sentAt = m.timestamp ? new Date(m.timestamp) : new Date();

    await this.messagesRepo.create({
      connectionId: connection.id,
      conversationId: conversation.id,
      externalId: m.externalId,
      direction: m.direction,
      messageType: m.messageType,
      content: m.content,
      mediaId: null,
      mediaUrl: m.mediaUrl ?? null,
      payload: m.payload ?? null,
      status: m.direction === 'out' ? 'SENT' : null,
      source: 'live',
      editedFromId: null,
      revokedAt: null,
      sentAt,
    });

    await this.conversationsRepo.update(conversation.id, {
      lastMessageAt: sentAt,
    });
  }

  /**
   * Maps an IG message to (type, human-readable content, media url, raw payload).
   * Attachments carry a temporary CDN url in payload.url (caduca — a later phase
   * downloads it to our storage).
   */
  private extractContent(message: {
    text?: string;
    attachments?: Array<{ type?: string; payload?: { url?: string } }>;
  }): {
    content: string | null;
    mediaUrl: string | null;
    messageType: string;
    payload: Record<string, unknown> | null;
  } {
    const att = message.attachments?.[0];
    if (att) {
      return {
        content: message.text ?? null,
        mediaUrl: att.payload?.url ?? null,
        messageType: att.type ?? 'attachment',
        payload: { attachments: message.attachments },
      };
    }
    return {
      content: message.text ?? null,
      mediaUrl: null,
      messageType: 'text',
      payload: message.text ? { text: message.text } : null,
    };
  }
}
