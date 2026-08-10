import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConnectionsRepository } from '../connections/infrastructure/persistence/relational/repositories/connections.repository';
import { ChannelEnum } from '../connections/domain/channel.enum';
import { Connection } from '../connections/domain/connection';
import { ContactsService } from '../contacts/contacts.service';
import { MessengerConversationRepository } from '../messenger-conversations/infrastructure/persistence/messenger-conversation.repository';
import { MessengerConversation } from '../messenger-conversations/domain/messenger-conversation';
import { MessengerMessageRepository } from '../messenger-messages/infrastructure/persistence/messenger-message.repository';
import { MsgrMessagingItem } from './messenger-webhook.service';
import { MetaProfileService } from './meta-profile.service';
import { RealtimeService } from '../realtime/realtime.service';

/**
 * Persists Facebook Messenger (Page) webhook events into the central contact
 * model and the messenger_conversation / messenger_message tables. Every PSID is
 * resolved to a central Contact via ContactsService.upsertIdentity, so the
 * unified inbox works across channels (same pattern as InstagramIngestService).
 */
@Injectable()
export class MessengerIngestService {
  private readonly logger = new Logger(MessengerIngestService.name);

  constructor(
    private readonly connectionsRepo: ConnectionsRepository,
    private readonly contactsService: ContactsService,
    private readonly conversationsRepo: MessengerConversationRepository,
    private readonly messagesRepo: MessengerMessageRepository,
    private readonly profileService: MetaProfileService,
    @Optional() private readonly realtime?: RealtimeService,
  ) {}

  /** Handles one entry[].messaging[] item (a message, echo, reaction, postback…). */
  async handleMessaging(
    entryId: string | undefined,
    item: MsgrMessagingItem,
  ): Promise<void> {
    // Our Page is the recipient for inbound, or the sender for echoes.
    const isEcho = item.message?.is_echo === true;
    const ourPageId = isEcho
      ? item.sender?.id
      : (item.recipient?.id ?? entryId);
    const peerId = isEcho ? item.recipient?.id : item.sender?.id;

    if (!peerId) {
      this.logger.debug('Messenger ingest: event without a peer id, skipping');
      return;
    }

    const connection = await this.resolveConnection(ourPageId);
    if (!connection) {
      this.logger.warn(
        `Messenger ingest: no connection for page=${ourPageId ?? '-'}`,
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

    // Postbacks (button taps, get-started, persistent menu) also carry a mid.
    if (item.postback) {
      const conversation = await this.resolveConversation(connection, peerId);
      await this.persist(connection, conversation, {
        externalId: item.postback.mid ?? `${peerId}:${item.timestamp ?? ''}`,
        direction: 'in',
        messageType: 'postback',
        content: item.postback.title ?? item.postback.payload ?? null,
        payload: { postback: item.postback },
        timestamp: item.timestamp,
      });
      return;
    }

    const message = item.message;
    if (!message?.mid) {
      this.logger.debug('Messenger ingest: non-message event, skipping');
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
    pageId: string | undefined,
  ): Promise<Connection | null> {
    if (!pageId) return null;
    const matches = await this.connectionsRepo.findByChannelAndAccount(
      ChannelEnum.facebook_page,
      pageId,
    );
    return matches[0] ?? null;
  }

  private async resolveConversation(
    connection: Connection,
    psid: string,
  ): Promise<MessengerConversation> {
    const existing = await this.conversationsRepo.findByConnectionAndUser(
      connection.id,
      psid,
    );
    if (existing) {
      // Self-heal: a thread whose name never resolved (lookup failed at
      // creation, or it predates the profile lookup) still carries only the
      // PSID. Retry the lookup on the next inbound message and backfill the
      // conversation + central contact once it succeeds. Best-effort.
      if (!existing.peerName) {
        const profile = await this.profileService.fetchProfile(
          connection,
          psid,
        );
        if (profile?.name) {
          await this.conversationsRepo.update(existing.id, {
            peerName: profile.name,
          });
          await this.contactsService.upsertIdentity({
            brandId: connection.brandId,
            channel: connection.channel,
            connectionId: connection.id,
            externalId: psid,
            profileName: profile.name,
            avatarUrl: profile.avatarUrl,
          });
          existing.peerName = profile.name;
        }
      }
      return existing;
    }

    // New thread → look up the peer's profile (the webhook only carries the
    // PSID) so the inbox shows a name instead of the id. Best-effort.
    const profile = await this.profileService.fetchProfile(connection, psid);

    // Resolve/create the central contact, seeding its display name + avatar.
    const { contact } = await this.contactsService.upsertIdentity({
      brandId: connection.brandId,
      channel: connection.channel,
      connectionId: connection.id,
      externalId: psid,
      profileName: profile?.name ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
    });

    return this.conversationsRepo.create({
      connectionId: connection.id,
      psid,
      contactId: contact.id,
      peerName: profile?.name ?? null,
      lastMessageAt: null,
    });
  }

  private async persist(
    connection: Connection,
    conversation: MessengerConversation,
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

    const created = await this.messagesRepo.create({
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

    this.realtime?.emitMessageCreated({
      brandId: connection.brandId,
      channel: connection.channel,
      connectionId: connection.id,
      conversationId: conversation.id,
      message: created,
    });
  }

  /**
   * Maps a Messenger message to (type, human-readable content, media url, raw
   * payload). Attachments carry a temporary CDN url in payload.url (caduca — a
   * later phase downloads it to our storage).
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
      // Normalize Messenger's attachment types to the ones the clients render.
      // Messenger sends documents as `file`; images/video/audio map 1:1. GIFs and
      // stickers arrive as `image` (an animated .gif / sticker url).
      const raw = att.type ?? 'attachment';
      const messageType = raw === 'file' ? 'document' : raw;
      return {
        content: message.text ?? null,
        mediaUrl: att.payload?.url ?? null,
        messageType,
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
