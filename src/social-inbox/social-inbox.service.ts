import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConnectionsRepository } from '../connections/infrastructure/persistence/relational/repositories/connections.repository';
import { ChannelEnum } from '../connections/domain/channel.enum';
import { Connection } from '../connections/domain/connection';
import { ContactsService } from '../contacts/contacts.service';
import { WhatsappConversation } from '../whatsapp-conversations/domain/whatsapp-conversation';
import { WhatsappConversationRepository } from '../whatsapp-conversations/infrastructure/persistence/whatsapp-conversation.repository';
import { WhatsappMessage } from '../whatsapp-messages/domain/whatsapp-message';
import { WhatsappMessageRepository } from '../whatsapp-messages/infrastructure/persistence/whatsapp-message.repository';
import { InstagramConversation } from '../instagram-conversations/domain/instagram-conversation';
import { InstagramConversationRepository } from '../instagram-conversations/infrastructure/persistence/instagram-conversation.repository';
import { InstagramMessage } from '../instagram-messages/domain/instagram-message';
import { InstagramMessageRepository } from '../instagram-messages/infrastructure/persistence/instagram-message.repository';
import { MessengerConversation } from '../messenger-conversations/domain/messenger-conversation';
import { MessengerConversationRepository } from '../messenger-conversations/infrastructure/persistence/messenger-conversation.repository';
import { MessengerMessage } from '../messenger-messages/domain/messenger-message';
import { MessengerMessageRepository } from '../messenger-messages/infrastructure/persistence/messenger-message.repository';
import {
  SendLocationInput,
  UploadFile,
  WhatsappMediaType,
  WhatsappSendService,
} from './whatsapp-send.service';
import { InstagramSendService } from './instagram-send.service';
import { MessengerSendService } from './messenger-send.service';

// Channels for which we currently store conversations/messages. As new channel
// sources are added (Messenger, TikTok, LinkedIn…), extend `listConversations` /
// `listMessages` with their source — the unified shape and the frontend do not
// change.
const INSTAGRAM_CHANNELS: ChannelEnum[] = [
  ChannelEnum.instagram,
  ChannelEnum.instagram_login,
];
const MESSENGER_CHANNELS: ChannelEnum[] = [ChannelEnum.facebook_page];
const MESSAGING_CHANNELS: ChannelEnum[] = [
  ChannelEnum.whatsapp,
  ...INSTAGRAM_CHANNELS,
  ...MESSENGER_CHANNELS,
];

export interface InboxAccount {
  connectionId: number;
  channel: string;
  accountHandle: string;
  status: string;
}

export interface UnifiedConversation {
  id: string;
  channel: string;
  connectionId: number;
  accountHandle: string;
  peer: string;
  contact: { id: string; displayName: string | null } | null;
  lastMessageAt: Date | null;
}

export interface UnifiedMessage {
  id: string;
  direction: 'in' | 'out';
  type: string;
  content: string | null;
  mediaId: string | null;
  mediaUrl: string | null;
  payload: Record<string, unknown> | null;
  status: string | null;
  revoked: boolean;
  edited: boolean;
  sentAt: Date;
}

@Injectable()
export class SocialInboxService {
  constructor(
    private readonly connectionsRepo: ConnectionsRepository,
    private readonly conversationsRepo: WhatsappConversationRepository,
    private readonly messagesRepo: WhatsappMessageRepository,
    private readonly igConversationsRepo: InstagramConversationRepository,
    private readonly igMessagesRepo: InstagramMessageRepository,
    private readonly messengerConversationsRepo: MessengerConversationRepository,
    private readonly messengerMessagesRepo: MessengerMessageRepository,
    private readonly contactsService: ContactsService,
    private readonly whatsappSend: WhatsappSendService,
    private readonly instagramSend: InstagramSendService,
    private readonly messengerSend: MessengerSendService,
  ) {}

  /** The brand's connected accounts that can hold conversations (for filters). */
  async listAccounts(brandId: number): Promise<InboxAccount[]> {
    const connections = await this.connectionsRepo.findByBrandId(brandId);
    return connections
      .filter((c) => MESSAGING_CHANNELS.includes(c.channel))
      .map((c) => ({
        connectionId: c.id,
        channel: c.channel,
        accountHandle: c.accountHandle,
        status: c.status,
      }));
  }

  /**
   * Unified conversation feed across every channel for the brand, most recent
   * first. Optional filters narrow by channel and/or a single account.
   */
  async listConversations(
    brandId: number,
    filters: { channel?: string; connectionId?: number } = {},
  ): Promise<UnifiedConversation[]> {
    const connections = await this.connectionsRepo.findByBrandId(brandId);
    const scoped = connections.filter((c) => {
      if (!MESSAGING_CHANNELS.includes(c.channel)) return false;
      if (filters.channel && c.channel !== filters.channel) return false;
      if (filters.connectionId && c.id !== filters.connectionId) return false;
      return true;
    });

    const [whatsapp, instagram, messenger] = await Promise.all([
      this.collectWhatsapp(scoped),
      this.collectInstagram(scoped),
      this.collectMessenger(scoped),
    ]);

    return [...whatsapp, ...instagram, ...messenger].sort(
      (a, b) =>
        (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0),
    );
  }

  /** Messages of a thread, oldest first — brand-scoped for isolation. */
  async listMessages(
    brandId: number,
    conversationId: string,
    channel: string,
  ): Promise<UnifiedMessage[]> {
    if (channel === ChannelEnum.whatsapp) {
      return this.whatsappMessages(brandId, conversationId);
    }
    if (INSTAGRAM_CHANNELS.includes(channel as ChannelEnum)) {
      return this.instagramMessages(brandId, conversationId);
    }
    if (MESSENGER_CHANNELS.includes(channel as ChannelEnum)) {
      return this.messengerMessages(brandId, conversationId);
    }
    // Unsupported channel yet → empty thread rather than an error.
    return [];
  }

  // ── WhatsApp source ──────────────────────────────────────────────────────
  private async collectWhatsapp(
    connections: Connection[],
  ): Promise<UnifiedConversation[]> {
    const waConnections = connections.filter(
      (c) => c.channel === ChannelEnum.whatsapp,
    );
    if (waConnections.length === 0) return [];

    const handleByConnId = new Map(
      waConnections.map((c) => [c.id, c.accountHandle]),
    );
    const conversations = await this.conversationsRepo.findByConnectionIds(
      waConnections.map((c) => c.id),
    );

    const contactIds = [
      ...new Set(
        conversations
          .map((c) => c.contactId)
          .filter((id): id is string => !!id),
      ),
    ];
    const contacts = contactIds.length
      ? await this.contactsService.findByIds(contactIds)
      : [];
    const contactById = new Map(contacts.map((c) => [c.id, c]));

    return conversations.map((conv) => ({
      id: conv.id,
      channel: ChannelEnum.whatsapp,
      connectionId: conv.connectionId,
      accountHandle: handleByConnId.get(conv.connectionId) ?? '',
      peer: conv.waUserPhone,
      contact: conv.contactId
        ? {
            id: conv.contactId,
            displayName: contactById.get(conv.contactId)?.displayName ?? null,
          }
        : null,
      lastMessageAt: conv.lastMessageAt ?? null,
    }));
  }

  // ── Instagram source ─────────────────────────────────────────────────────
  private async collectInstagram(
    connections: Connection[],
  ): Promise<UnifiedConversation[]> {
    const igConnections = connections.filter((c) =>
      INSTAGRAM_CHANNELS.includes(c.channel),
    );
    if (igConnections.length === 0) return [];

    const connById = new Map(igConnections.map((c) => [c.id, c]));
    const conversations = await this.igConversationsRepo.findByConnectionIds(
      igConnections.map((c) => c.id),
    );

    const contactIds = [
      ...new Set(
        conversations
          .map((c) => c.contactId)
          .filter((id): id is string => !!id),
      ),
    ];
    const contacts = contactIds.length
      ? await this.contactsService.findByIds(contactIds)
      : [];
    const contactById = new Map(contacts.map((c) => [c.id, c]));

    return conversations.map((conv) => ({
      id: conv.id,
      channel:
        connById.get(conv.connectionId)?.channel ?? ChannelEnum.instagram,
      connectionId: conv.connectionId,
      accountHandle: connById.get(conv.connectionId)?.accountHandle ?? '',
      peer: conv.peerUsername ?? conv.igUserId,
      contact: conv.contactId
        ? {
            id: conv.contactId,
            displayName: contactById.get(conv.contactId)?.displayName ?? null,
          }
        : null,
      lastMessageAt: conv.lastMessageAt ?? null,
    }));
  }

  // ── Messenger source ─────────────────────────────────────────────────────
  private async collectMessenger(
    connections: Connection[],
  ): Promise<UnifiedConversation[]> {
    const fbConnections = connections.filter((c) =>
      MESSENGER_CHANNELS.includes(c.channel),
    );
    if (fbConnections.length === 0) return [];

    const connById = new Map(fbConnections.map((c) => [c.id, c]));
    const conversations =
      await this.messengerConversationsRepo.findByConnectionIds(
        fbConnections.map((c) => c.id),
      );

    const contactIds = [
      ...new Set(
        conversations
          .map((c) => c.contactId)
          .filter((id): id is string => !!id),
      ),
    ];
    const contacts = contactIds.length
      ? await this.contactsService.findByIds(contactIds)
      : [];
    const contactById = new Map(contacts.map((c) => [c.id, c]));

    return conversations.map((conv) => ({
      id: conv.id,
      channel:
        connById.get(conv.connectionId)?.channel ?? ChannelEnum.facebook_page,
      connectionId: conv.connectionId,
      accountHandle: connById.get(conv.connectionId)?.accountHandle ?? '',
      peer: conv.peerName ?? conv.psid,
      contact: conv.contactId
        ? {
            id: conv.contactId,
            displayName: contactById.get(conv.contactId)?.displayName ?? null,
          }
        : null,
      lastMessageAt: conv.lastMessageAt ?? null,
    }));
  }

  /**
   * Sends an outbound message and mirrors it into the thread so it appears
   * immediately. WhatsApp goes through Cloud API; Instagram/Messenger through the
   * Graph messaging API. All enforce a 24h messaging window (Meta's error
   * surfaces).
   */
  async sendMessage(
    brandId: number,
    conversationId: string,
    channel: string,
    text: string,
  ): Promise<UnifiedMessage> {
    const body = text?.trim();
    if (!body) {
      throw new BadRequestException('Message text is required');
    }

    if (INSTAGRAM_CHANNELS.includes(channel as ChannelEnum)) {
      return this.sendInstagram(brandId, conversationId, body);
    }
    if (MESSENGER_CHANNELS.includes(channel as ChannelEnum)) {
      return this.sendMessenger(brandId, conversationId, body);
    }
    if (channel !== ChannelEnum.whatsapp) {
      throw new BadRequestException(
        `Sending is not supported for channel "${channel}" yet`,
      );
    }

    const { conversation, connection } = await this.resolveScopedWhatsapp(
      brandId,
      conversationId,
    );

    const wamid = await this.whatsappSend.sendText(
      connection,
      conversation.waUserPhone,
      body,
    );

    return this.persistOutbound(connection, conversation, {
      externalId: wamid,
      messageType: 'text',
      content: body,
    });
  }

  private async sendInstagram(
    brandId: number,
    conversationId: string,
    body: string,
  ): Promise<UnifiedMessage> {
    const { conversation, connection } = await this.resolveScopedInstagram(
      brandId,
      conversationId,
    );
    const mid = await this.instagramSend.sendText(
      connection,
      conversation.igUserId,
      body,
    );
    const created = await this.igMessagesRepo.create({
      connectionId: connection.id,
      conversationId: conversation.id,
      externalId: mid,
      direction: 'out',
      messageType: 'text',
      content: body,
      mediaId: null,
      mediaUrl: null,
      payload: null,
      status: 'SENT',
      source: 'live',
      editedFromId: null,
      revokedAt: null,
      sentAt: new Date(),
    });
    await this.igConversationsRepo.update(conversation.id, {
      lastMessageAt: created.sentAt,
    });
    return this.mapInstagramMessage(created);
  }

  private async sendMessenger(
    brandId: number,
    conversationId: string,
    body: string,
  ): Promise<UnifiedMessage> {
    const { conversation, connection } = await this.resolveScopedMessenger(
      brandId,
      conversationId,
    );
    const mid = await this.messengerSend.sendText(
      connection,
      conversation.psid,
      body,
    );
    const created = await this.messengerMessagesRepo.create({
      connectionId: connection.id,
      conversationId: conversation.id,
      externalId: mid,
      direction: 'out',
      messageType: 'text',
      content: body,
      mediaId: null,
      mediaUrl: null,
      payload: null,
      status: 'SENT',
      source: 'live',
      editedFromId: null,
      revokedAt: null,
      sentAt: new Date(),
    });
    await this.messengerConversationsRepo.update(conversation.id, {
      lastMessageAt: created.sentAt,
    });
    return this.mapMessengerMessage(created);
  }

  /** Sends a location message (lat/long + optional name/address). */
  async sendLocation(
    brandId: number,
    conversationId: string,
    channel: string,
    loc: SendLocationInput,
  ): Promise<UnifiedMessage> {
    if (channel !== ChannelEnum.whatsapp) {
      throw new BadRequestException(
        `Sending is not supported for channel "${channel}" yet`,
      );
    }
    const { conversation, connection } = await this.resolveScopedWhatsapp(
      brandId,
      conversationId,
    );
    const wamid = await this.whatsappSend.sendLocation(
      connection,
      conversation.waUserPhone,
      loc,
    );
    const label =
      [loc.name, loc.address].filter(Boolean).join(' · ') ||
      `${loc.latitude}, ${loc.longitude}`;
    return this.persistOutbound(connection, conversation, {
      externalId: wamid,
      messageType: 'location',
      content: label,
      payload: { ...loc },
    });
  }

  /** Uploads a file to Cloud API and sends it as image/audio/video/document. */
  async sendMedia(
    brandId: number,
    conversationId: string,
    channel: string,
    file: UploadFile,
    caption?: string,
  ): Promise<UnifiedMessage> {
    if (channel !== ChannelEnum.whatsapp) {
      throw new BadRequestException(
        `Sending is not supported for channel "${channel}" yet`,
      );
    }
    const { conversation, connection } = await this.resolveScopedWhatsapp(
      brandId,
      conversationId,
    );

    const type = this.mediaTypeFromMime(file.mimetype);
    const mediaId = await this.whatsappSend.uploadMedia(connection, file);
    const wamid = await this.whatsappSend.sendMedia(
      connection,
      conversation.waUserPhone,
      type,
      { mediaId, caption, filename: file.originalname },
    );

    return this.persistOutbound(connection, conversation, {
      externalId: wamid,
      messageType: type,
      content: caption ?? null,
      mediaId,
      payload: { filename: file.originalname, mime_type: file.mimetype },
    });
  }

  private mediaTypeFromMime(mime: string): WhatsappMediaType {
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime.startsWith('video/')) return 'video';
    return 'document';
  }

  // Persists an outbound message and bumps the thread's lastMessageAt.
  private async persistOutbound(
    connection: Connection,
    conversation: WhatsappConversation,
    m: {
      externalId: string;
      messageType: string;
      content: string | null;
      mediaId?: string | null;
      payload?: Record<string, unknown> | null;
    },
  ): Promise<UnifiedMessage> {
    const created = await this.messagesRepo.create({
      connectionId: connection.id,
      conversationId: conversation.id,
      externalId: m.externalId,
      direction: 'out',
      messageType: m.messageType,
      content: m.content,
      mediaId: m.mediaId ?? null,
      mediaUrl: null,
      payload: m.payload ?? null,
      status: 'SENT',
      source: 'live',
      editedFromId: null,
      revokedAt: null,
      sentAt: new Date(),
    });
    await this.conversationsRepo.update(conversation.id, {
      lastMessageAt: created.sentAt,
    });
    return this.mapMessage(created);
  }

  private async whatsappMessages(
    brandId: number,
    conversationId: string,
  ): Promise<UnifiedMessage[]> {
    await this.resolveScopedWhatsapp(brandId, conversationId);
    const messages =
      await this.messagesRepo.findByConversationId(conversationId);
    return messages.map((m) => this.mapMessage(m));
  }

  // Resolves a conversation and its connection, enforcing brand ownership.
  private async resolveScopedWhatsapp(
    brandId: number,
    conversationId: string,
  ): Promise<{ conversation: WhatsappConversation; connection: Connection }> {
    const conversation = await this.conversationsRepo.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    const connection = await this.connectionsRepo.findById(
      conversation.connectionId,
    );
    // Do not leak the existence of another brand's conversation.
    if (!connection || connection.brandId !== brandId) {
      throw new NotFoundException('Conversation not found');
    }
    return { conversation, connection };
  }

  private mapMessage(m: WhatsappMessage): UnifiedMessage {
    return {
      id: m.id,
      direction: m.direction === 'out' ? 'out' : 'in',
      type: m.messageType,
      content: m.content ?? null,
      mediaId: m.mediaId ?? null,
      mediaUrl: m.mediaUrl ?? null,
      payload: m.payload ?? null,
      status: m.status ?? null,
      revoked: !!m.revokedAt,
      edited: !!m.editedFromId,
      sentAt: m.sentAt,
    };
  }

  // ── Instagram helpers ────────────────────────────────────────────────────
  private async instagramMessages(
    brandId: number,
    conversationId: string,
  ): Promise<UnifiedMessage[]> {
    await this.resolveScopedInstagram(brandId, conversationId);
    const messages =
      await this.igMessagesRepo.findByConversationId(conversationId);
    return messages.map((m) => this.mapInstagramMessage(m));
  }

  // Resolves an IG conversation and its connection, enforcing brand ownership.
  private async resolveScopedInstagram(
    brandId: number,
    conversationId: string,
  ): Promise<{ conversation: InstagramConversation; connection: Connection }> {
    const conversation =
      await this.igConversationsRepo.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    const connection = await this.connectionsRepo.findById(
      conversation.connectionId,
    );
    if (!connection || connection.brandId !== brandId) {
      throw new NotFoundException('Conversation not found');
    }
    return { conversation, connection };
  }

  private mapInstagramMessage(m: InstagramMessage): UnifiedMessage {
    return {
      id: m.id,
      direction: m.direction === 'out' ? 'out' : 'in',
      type: m.messageType,
      content: m.content ?? null,
      mediaId: m.mediaId ?? null,
      mediaUrl: m.mediaUrl ?? null,
      payload: m.payload ?? null,
      status: m.status ?? null,
      revoked: !!m.revokedAt,
      edited: !!m.editedFromId,
      sentAt: m.sentAt,
    };
  }

  // ── Messenger helpers ────────────────────────────────────────────────────
  private async messengerMessages(
    brandId: number,
    conversationId: string,
  ): Promise<UnifiedMessage[]> {
    await this.resolveScopedMessenger(brandId, conversationId);
    const messages =
      await this.messengerMessagesRepo.findByConversationId(conversationId);
    return messages.map((m) => this.mapMessengerMessage(m));
  }

  // Resolves a Messenger conversation and its connection, enforcing brand ownership.
  private async resolveScopedMessenger(
    brandId: number,
    conversationId: string,
  ): Promise<{ conversation: MessengerConversation; connection: Connection }> {
    const conversation =
      await this.messengerConversationsRepo.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    const connection = await this.connectionsRepo.findById(
      conversation.connectionId,
    );
    if (!connection || connection.brandId !== brandId) {
      throw new NotFoundException('Conversation not found');
    }
    return { conversation, connection };
  }

  private mapMessengerMessage(m: MessengerMessage): UnifiedMessage {
    return {
      id: m.id,
      direction: m.direction === 'out' ? 'out' : 'in',
      type: m.messageType,
      content: m.content ?? null,
      mediaId: m.mediaId ?? null,
      mediaUrl: m.mediaUrl ?? null,
      payload: m.payload ?? null,
      status: m.status ?? null,
      revoked: !!m.revokedAt,
      edited: !!m.editedFromId,
      sentAt: m.sentAt,
    };
  }
}
