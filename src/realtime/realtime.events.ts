/**
 * Realtime contract shared by the gateway, the emitter service and (as a
 * reference) the web/mobile clients. Events flow over the socket.io namespace
 * `/rt`. Rooms are namespaced per brand so a socket only ever receives events
 * for the brand it authenticated against — mirroring the REST `x-brand-id`
 * isolation enforced by BrandGuard.
 */

export const RT_NAMESPACE = '/rt';

/** Server → client events. */
export const RtServerEvent = {
  /** A new inbound/outbound message was persisted. */
  MessageNew: 'message:new',
  /** A thread's ordering fields changed (e.g. lastMessageAt). */
  ConversationUpdated: 'conversation:updated',
  /** Someone is (or stopped) typing in a thread. */
  TypingUpdate: 'typing:update',
} as const;

/** Client → server events. */
export const RtClientEvent = {
  TypingStart: 'typing:start',
  TypingStop: 'typing:stop',
} as const;

/**
 * Unified message shape — mirrors `UnifiedMessage` from the social-inbox REST
 * layer so clients can reuse the same model for the POST response and the push.
 */
export interface RtUnifiedMessage {
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

/**
 * Structural shape of a persisted channel message. The WhatsApp / Instagram /
 * Messenger domain messages all share these field names, so a single mapper
 * serves every channel.
 */
export interface PersistedMessageLike {
  id: string;
  direction: string;
  messageType: string;
  content?: string | null;
  mediaId?: string | null;
  mediaUrl?: string | null;
  payload?: Record<string, unknown> | null;
  status?: string | null;
  revokedAt?: Date | null;
  editedFromId?: string | null;
  sentAt: Date;
}

export function toRtMessage(m: PersistedMessageLike): RtUnifiedMessage {
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

export interface MessageEventPayload {
  brandId: number;
  channel: string;
  connectionId: number;
  conversationId: string;
  message: RtUnifiedMessage;
}

export interface ConversationEventPayload {
  brandId: number;
  channel: string;
  connectionId: number;
  conversationId: string;
  lastMessageAt: Date | null;
}

export interface TypingEventPayload {
  conversationId: string;
  channel: string;
  userId: number;
  typing: boolean;
}

/** Per-brand room: every authenticated socket joins exactly one of these. */
export const brandRoom = (brandId: number): string => `brand:${brandId}`;
