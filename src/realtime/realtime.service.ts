import { Injectable, Logger } from '@nestjs/common';
import type { Server } from 'socket.io';
import {
  brandRoom,
  ConversationEventPayload,
  MessageEventPayload,
  PersistedMessageLike,
  RtServerEvent,
  TypingEventPayload,
  toRtMessage,
} from './realtime.events';

/**
 * Thin façade that domain code (ingest + send services) uses to push realtime
 * events without depending on the socket.io gateway class. The gateway binds
 * its `Server` here on init.
 *
 * Injected with `@Optional()` at every call site: in the BullMQ worker process
 * there is no socket server, so `RealtimeService` is absent and emits are simply
 * skipped (history backfill must not push live events anyway).
 */
@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private server: Server | null = null;

  /** Called once by the gateway's afterInit. */
  bindServer(server: Server): void {
    this.server = server;
  }

  /**
   * Emits a newly persisted message to the brand room and bumps the thread's
   * position with a `conversation:updated`.
   */
  emitMessageCreated(input: {
    brandId: number;
    channel: string;
    connectionId: number;
    conversationId: string;
    message: PersistedMessageLike;
  }): void {
    const payload: MessageEventPayload = {
      brandId: input.brandId,
      channel: input.channel,
      connectionId: input.connectionId,
      conversationId: input.conversationId,
      message: toRtMessage(input.message),
    };
    this.emit(input.brandId, RtServerEvent.MessageNew, payload);
    this.emitConversationUpdated({
      brandId: input.brandId,
      channel: input.channel,
      connectionId: input.connectionId,
      conversationId: input.conversationId,
      lastMessageAt: input.message.sentAt,
    });
  }

  emitConversationUpdated(payload: ConversationEventPayload): void {
    this.emit(payload.brandId, RtServerEvent.ConversationUpdated, payload);
  }

  emitTyping(brandId: number, payload: TypingEventPayload): void {
    this.emit(brandId, RtServerEvent.TypingUpdate, payload);
  }

  private emit(brandId: number, event: string, payload: unknown): void {
    if (!this.server) return; // no socket server in this process (e.g. worker)
    try {
      this.server.to(brandRoom(brandId)).emit(event, payload);
    } catch (err) {
      this.logger.warn(
        `realtime emit failed (${event}): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
