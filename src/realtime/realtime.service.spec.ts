import type { Server } from 'socket.io';
import { RealtimeService } from './realtime.service';
import { PersistedMessageLike } from './realtime.events';

const MESSAGE: PersistedMessageLike = {
  id: 'm1',
  direction: 'in',
  messageType: 'text',
  content: 'hola',
  mediaId: null,
  mediaUrl: null,
  payload: null,
  status: null,
  revokedAt: null,
  editedFromId: null,
  sentAt: new Date('2026-08-08T10:00:00Z'),
};

const makeServer = () => {
  const emit = jest.fn();
  const to = jest.fn().mockReturnValue({ emit });
  const server = { to } as unknown as Server;
  return { server, to, emit };
};

describe('RealtimeService', () => {
  it('should emit message:new and conversation:updated to the brand room', () => {
    const { server, to, emit } = makeServer();
    const service = new RealtimeService();
    service.bindServer(server);

    service.emitMessageCreated({
      brandId: 7,
      channel: 'whatsapp',
      connectionId: 5,
      conversationId: 'conv1',
      message: MESSAGE,
    });

    expect(to).toHaveBeenCalledWith('brand:7');
    expect(emit).toHaveBeenCalledWith(
      'message:new',
      expect.objectContaining({
        brandId: 7,
        channel: 'whatsapp',
        connectionId: 5,
        conversationId: 'conv1',
        message: expect.objectContaining({ id: 'm1', direction: 'in' }),
      }),
    );
    expect(emit).toHaveBeenCalledWith(
      'conversation:updated',
      expect.objectContaining({
        conversationId: 'conv1',
        lastMessageAt: MESSAGE.sentAt,
      }),
    );
  });

  it('should relay typing to the brand room', () => {
    const { server, to, emit } = makeServer();
    const service = new RealtimeService();
    service.bindServer(server);

    service.emitTyping(7, {
      conversationId: 'conv1',
      channel: 'whatsapp',
      userId: 3,
      typing: true,
    });

    expect(to).toHaveBeenCalledWith('brand:7');
    expect(emit).toHaveBeenCalledWith(
      'typing:update',
      expect.objectContaining({ conversationId: 'conv1', typing: true }),
    );
  });

  it('should be a no-op when no server is bound (e.g. worker process)', () => {
    const service = new RealtimeService();
    expect(() =>
      service.emitMessageCreated({
        brandId: 7,
        channel: 'whatsapp',
        connectionId: 5,
        conversationId: 'conv1',
        message: MESSAGE,
      }),
    ).not.toThrow();
  });
});
