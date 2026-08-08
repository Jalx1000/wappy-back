import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConnectionsRepository } from '../connections/infrastructure/persistence/relational/repositories/connections.repository';
import { ChannelEnum } from '../connections/domain/channel.enum';
import { Connection } from '../connections/domain/connection';
import { ContactsService } from '../contacts/contacts.service';
import { WhatsappConversationRepository } from '../whatsapp-conversations/infrastructure/persistence/whatsapp-conversation.repository';
import { WhatsappConversation } from '../whatsapp-conversations/domain/whatsapp-conversation';
import { WhatsappMessageRepository } from '../whatsapp-messages/infrastructure/persistence/whatsapp-message.repository';
import { RealtimeService } from '../realtime/realtime.service';

// --- Minimal shapes of the webhook change `value` objects (see
// manual-integracion/whatsapp/coexistence/02-webhooks-referencia.md). ---
interface WaMetadata {
  phone_number_id?: string;
  display_phone_number?: string;
}

interface WaMessage {
  from?: string;
  to?: string;
  id?: string;
  timestamp?: string;
  type?: string;
  edit?: { original_message_id?: string; message?: Record<string, unknown> };
  revoke?: { original_message_id?: string };
  [key: string]: unknown;
}

interface StateSyncItem {
  type?: string;
  action?: string;
  contact?: {
    full_name?: string;
    first_name?: string;
    phone_number?: string;
  };
}

interface WithMetadata {
  metadata?: WaMetadata;
}

interface HistoryThread {
  id?: string; // WhatsApp user phone number
  messages?: WaMessage[];
}

interface HistoryChunk {
  metadata?: { phase?: number; chunk_order?: number; progress?: number };
  threads?: HistoryThread[];
  errors?: Array<{ code?: number; title?: string; message?: string }>;
}

interface HistoryValue extends WithMetadata {
  history?: HistoryChunk[];
  messages?: WaMessage[]; // media-asset follow-up webhooks
}

/**
 * Persists WhatsApp Coexistence webhook payloads into the central contact model
 * and the whatsapp_conversation / whatsapp_message tables. Every WhatsApp user
 * is resolved to a central Contact via ContactsService.upsertIdentity, so the
 * unified inbox works across channels.
 *
 * `history` is processed off the request via ingestHistory() (BullMQ worker,
 * QUEUE_WHATSAPP_SYNC) because a single webhook can carry thousands of messages.
 *
 * TODO: `account_update` (flip Connection status on PARTNER_REMOVED /
 * ACCOUNT_OFFBOARDED / ACCOUNT_RECONNECTED).
 */
@Injectable()
export class WhatsappIngestService {
  private readonly logger = new Logger(WhatsappIngestService.name);

  constructor(
    private readonly connectionsRepo: ConnectionsRepository,
    private readonly contactsService: ContactsService,
    private readonly conversationsRepo: WhatsappConversationRepository,
    private readonly messagesRepo: WhatsappMessageRepository,
    // Absent in the worker process (history backfill), so injection is optional.
    @Optional() private readonly realtime?: RealtimeService,
  ) {}

  async handleChange(field: string, value: unknown): Promise<void> {
    const connection = await this.resolveConnection(value as WithMetadata);
    if (!connection) {
      this.logger.warn(
        `WhatsApp ingest: no connection for phone_number_id=${
          (value as WithMetadata)?.metadata?.phone_number_id ?? '-'
        } (field=${field})`,
      );
      return;
    }

    switch (field) {
      case 'smb_app_state_sync':
        await this.ingestContactSync(connection, value);
        break;
      case 'smb_message_echoes':
        await this.ingestEchoes(connection, value);
        break;
      case 'messages':
        await this.ingestMessages(connection, value);
        break;
      // history / account_update handled elsewhere (see class TODO).
      default:
        this.logger.debug(`WhatsApp ingest: field ${field} not handled here`);
    }
  }

  /**
   * Processes a `history` webhook off the request (BullMQ worker). Chat-history
   * sharing produces phased/chunked webhooks with up to thousands of messages;
   * media assets arrive in separate follow-up webhooks carrying value.messages[].
   */
  async ingestHistory(value: unknown): Promise<void> {
    const payload = value as HistoryValue;
    const connection = await this.resolveConnection(payload);
    if (!connection) {
      this.logger.warn(
        `WhatsApp history: no connection for phone_number_id=${
          payload?.metadata?.phone_number_id ?? '-'
        }`,
      );
      return;
    }

    // Media-asset follow-ups enrich a placeholder message already stored.
    for (const m of payload.messages ?? []) {
      if (!m.id) continue;
      const existing = await this.messagesRepo.findByConnectionAndExternalId(
        connection.id,
        m.id,
      );
      if (!existing) continue;
      const {
        content,
        mediaId,
        mediaUrl,
        payload: mediaPayload,
      } = this.extractContent(m);
      await this.messagesRepo.update(existing.id, {
        messageType: m.type ?? existing.messageType,
        content: content ?? existing.content,
        mediaId,
        mediaUrl,
        payload: mediaPayload,
      });
    }

    const businessPhone = payload.metadata?.display_phone_number;

    for (const chunk of payload.history ?? []) {
      if (chunk.errors?.length) {
        const err = chunk.errors[0];
        this.logger.log(
          `WhatsApp history: chunk error ${err.code ?? '-'} (${
            err.title ?? 'history not shared'
          }) for connection ${connection.id}`,
        );
        continue;
      }
      for (const thread of chunk.threads ?? []) {
        const waUser = thread.id;
        if (!waUser) continue;
        const conversation = await this.resolveConversation(connection, waUser);
        for (const msg of thread.messages ?? []) {
          if (!msg.id) continue;
          const direction: 'in' | 'out' =
            msg.to || (businessPhone && msg.from === businessPhone)
              ? 'out'
              : 'in';
          await this.upsertMessage(
            connection,
            conversation,
            msg,
            direction,
            'history',
          );
        }
      }
      const meta = chunk.metadata ?? {};
      this.logger.log(
        `WhatsApp history: connection ${connection.id} phase=${
          meta.phase ?? '-'
        } chunk=${meta.chunk_order ?? '-'} progress=${meta.progress ?? '-'}`,
      );
    }
  }

  private async resolveConnection(
    value: WithMetadata,
  ): Promise<Connection | null> {
    const phoneNumberId = value?.metadata?.phone_number_id;
    if (!phoneNumberId) return null;
    const matches = await this.connectionsRepo.findByChannelAndAccount(
      ChannelEnum.whatsapp,
      phoneNumberId,
    );
    return matches[0] ?? null;
  }

  private async ingestContactSync(
    connection: Connection,
    value: unknown,
  ): Promise<void> {
    const items = (value as { state_sync?: StateSyncItem[] }).state_sync ?? [];
    for (const item of items) {
      if (item.type !== 'contact' || !item.contact?.phone_number) continue;
      if (item.action === 'remove') {
        // Non-destructive: keep the contact, just note the removal.
        this.logger.log(
          `WhatsApp ingest: contact ${item.contact.phone_number} removed by business (kept)`,
        );
        continue;
      }
      await this.contactsService.upsertIdentity({
        brandId: connection.brandId,
        channel: ChannelEnum.whatsapp,
        connectionId: connection.id,
        externalId: item.contact.phone_number,
        profileName: item.contact.full_name ?? item.contact.first_name ?? null,
        phone: item.contact.phone_number,
      });
    }
  }

  private async ingestEchoes(
    connection: Connection,
    value: unknown,
  ): Promise<void> {
    const echoes =
      (value as { message_echoes?: WaMessage[] }).message_echoes ?? [];
    for (const msg of echoes) {
      const waUser = msg.to;
      if (!waUser || !msg.id) continue;
      const conversation = await this.resolveConversation(connection, waUser);
      await this.upsertMessage(connection, conversation, msg, 'out', 'echo');
    }
  }

  private async ingestMessages(
    connection: Connection,
    value: unknown,
  ): Promise<void> {
    const messages = (value as { messages?: WaMessage[] }).messages ?? [];
    for (const msg of messages) {
      if (msg.type === 'edit' && msg.edit?.original_message_id) {
        await this.applyEdit(connection, msg);
        continue;
      }
      if (msg.type === 'revoke' && msg.revoke?.original_message_id) {
        await this.applyRevoke(connection, msg.revoke.original_message_id);
        continue;
      }
      const waUser = msg.from;
      if (!waUser || !msg.id) continue;
      const conversation = await this.resolveConversation(connection, waUser);
      await this.upsertMessage(connection, conversation, msg, 'in', 'live');
    }
  }

  private async resolveConversation(
    connection: Connection,
    waUserPhone: string,
  ): Promise<WhatsappConversation> {
    const existing = await this.conversationsRepo.findByConnectionAndUser(
      connection.id,
      waUserPhone,
    );
    if (existing) return existing;

    // New thread → resolve/create the central contact first.
    const { contact } = await this.contactsService.upsertIdentity({
      brandId: connection.brandId,
      channel: ChannelEnum.whatsapp,
      connectionId: connection.id,
      externalId: waUserPhone,
      phone: waUserPhone,
    });

    return this.conversationsRepo.create({
      connectionId: connection.id,
      waUserPhone,
      contactId: contact.id,
      lastMessageAt: null,
    });
  }

  private async upsertMessage(
    connection: Connection,
    conversation: WhatsappConversation,
    msg: WaMessage,
    direction: 'in' | 'out',
    source: 'echo' | 'live' | 'history',
  ): Promise<void> {
    const externalId = msg.id!;
    const existing = await this.messagesRepo.findByConnectionAndExternalId(
      connection.id,
      externalId,
    );
    if (existing) return; // idempotent

    const { content, mediaId, mediaUrl, payload } = this.extractContent(msg);
    const sentAt = msg.timestamp
      ? new Date(parseInt(msg.timestamp, 10) * 1000)
      : new Date();

    const created = await this.messagesRepo.create({
      connectionId: connection.id,
      conversationId: conversation.id,
      externalId,
      direction,
      messageType: msg.type ?? 'unknown',
      content,
      mediaId,
      mediaUrl,
      payload,
      status: null,
      source,
      editedFromId: null,
      revokedAt: null,
      sentAt,
    });

    await this.conversationsRepo.update(conversation.id, {
      lastMessageAt: sentAt,
    });

    // Push live traffic (inbound + our own echoes) to connected agents. History
    // backfill runs in the worker (no socket server) and must not push.
    if (source !== 'history') {
      this.realtime?.emitMessageCreated({
        brandId: connection.brandId,
        channel: ChannelEnum.whatsapp,
        connectionId: connection.id,
        conversationId: conversation.id,
        message: created,
      });
    }
  }

  private async applyEdit(
    connection: Connection,
    msg: WaMessage,
  ): Promise<void> {
    const originalId = msg.edit!.original_message_id!;
    const original = await this.messagesRepo.findByConnectionAndExternalId(
      connection.id,
      originalId,
    );
    if (!original) {
      this.logger.warn(
        `WhatsApp ingest: edit for unknown message ${originalId}`,
      );
      return;
    }
    const editedMsg = { type: 'text', ...msg.edit!.message } as WaMessage;
    const { content, mediaId, mediaUrl, payload } =
      this.extractContent(editedMsg);
    await this.messagesRepo.update(original.id, {
      content,
      mediaId,
      mediaUrl,
      payload,
      editedFromId: originalId,
    });
  }

  private async applyRevoke(
    connection: Connection,
    originalId: string,
  ): Promise<void> {
    const original = await this.messagesRepo.findByConnectionAndExternalId(
      connection.id,
      originalId,
    );
    if (!original) {
      this.logger.warn(
        `WhatsApp ingest: revoke for unknown message ${originalId}`,
      );
      return;
    }
    await this.messagesRepo.update(original.id, { revokedAt: new Date() });
  }

  /**
   * Detects the message type and extracts a human-readable `content` preview, a
   * media id/url when present, and the raw type-specific object as `payload` (so
   * the UI can render image/audio/document/location/contacts richly). Shapes per
   * manual-integracion/whatsapp/WhatsApp Cloud API.postman_collection.json.
   */
  private extractContent(msg: WaMessage): {
    content: string | null;
    mediaId: string | null;
    mediaUrl: string | null;
    payload: Record<string, unknown> | null;
  } {
    const type = msg.type;
    if (!type || type === 'media_placeholder') {
      return { content: null, mediaId: null, mediaUrl: null, payload: null };
    }

    const s = (v: unknown): string | null =>
      typeof v === 'string' && v.length ? v : null;
    const obj = (msg[type] as Record<string, unknown> | undefined) ?? null;
    const media = () => ({
      mediaId: s(obj?.id),
      mediaUrl: s(obj?.url),
      payload: obj,
    });

    switch (type) {
      case 'text':
        return {
          content: s(obj?.body),
          mediaId: null,
          mediaUrl: null,
          payload: obj,
        };
      case 'image':
      case 'video':
        return { content: s(obj?.caption), ...media() };
      case 'audio':
      case 'voice':
      case 'sticker':
        return { content: null, ...media() };
      case 'document':
        // "documento con mensaje" → caption; filename kept in payload.
        return { content: s(obj?.caption) ?? s(obj?.filename), ...media() };
      case 'location': {
        const label =
          [s(obj?.name), s(obj?.address)].filter(Boolean).join(' · ') ||
          `${(obj?.latitude as string) ?? '?'}, ${
            (obj?.longitude as string) ?? '?'
          }`;
        return { content: label, mediaId: null, mediaUrl: null, payload: obj };
      }
      case 'contacts': {
        const list =
          (msg.contacts as Array<{ name?: { formatted_name?: string } }>) ?? [];
        const names = list
          .map((c) => c.name?.formatted_name)
          .filter(Boolean)
          .join(', ');
        return {
          content: names || 'Contacto compartido',
          mediaId: null,
          mediaUrl: null,
          payload: { contacts: list },
        };
      }
      case 'reaction':
        return {
          content: s(obj?.emoji),
          mediaId: null,
          mediaUrl: null,
          payload: obj,
        };
      case 'button':
        return {
          content: s(obj?.text),
          mediaId: null,
          mediaUrl: null,
          payload: obj,
        };
      case 'interactive': {
        const br = obj?.button_reply as { title?: string } | undefined;
        const lr = obj?.list_reply as { title?: string } | undefined;
        return {
          content: s(br?.title) ?? s(lr?.title),
          mediaId: null,
          mediaUrl: null,
          payload: obj,
        };
      }
      default:
        return {
          content: s(obj?.caption) ?? s(obj?.body),
          mediaId: s(obj?.id),
          mediaUrl: s(obj?.url),
          payload: obj,
        };
    }
  }
}
