import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SocialInboxService } from './social-inbox.service';
import { ConnectionsRepository } from '../connections/infrastructure/persistence/relational/repositories/connections.repository';
import { ContactsService } from '../contacts/contacts.service';
import { WhatsappConversationRepository } from '../whatsapp-conversations/infrastructure/persistence/whatsapp-conversation.repository';
import { WhatsappMessageRepository } from '../whatsapp-messages/infrastructure/persistence/whatsapp-message.repository';
import { InstagramConversationRepository } from '../instagram-conversations/infrastructure/persistence/instagram-conversation.repository';
import { InstagramMessageRepository } from '../instagram-messages/infrastructure/persistence/instagram-message.repository';
import { MessengerConversationRepository } from '../messenger-conversations/infrastructure/persistence/messenger-conversation.repository';
import { MessengerMessageRepository } from '../messenger-messages/infrastructure/persistence/messenger-message.repository';
import { ConversationAssignmentRepository } from '../conversation-assignments/infrastructure/persistence/conversation-assignment.repository';
import { WhatsappSendService } from './whatsapp-send.service';
import { InstagramSendService } from './instagram-send.service';
import { MessengerSendService } from './messenger-send.service';
import { ConversationRatingsService } from '../conversation-ratings/conversation-ratings.service';
import { ConversationStatesService } from '../conversation-states/conversation-states.service';

const CONNECTION = {
  id: 5,
  brandId: 7,
  accountId: 'PNID',
  accountHandle: '+1',
};
const CONVERSATION = {
  id: 'conv1',
  connectionId: 5,
  waUserPhone: '16505551234',
};

const makeService = () => {
  const connectionsRepo = {
    findById: jest.fn().mockResolvedValue(CONNECTION),
    findByBrandId: jest.fn(),
  } as unknown as jest.Mocked<ConnectionsRepository>;

  const conversationsRepo = {
    findById: jest.fn().mockResolvedValue(CONVERSATION),
    update: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<WhatsappConversationRepository>;

  const messagesRepo = {
    create: jest.fn().mockResolvedValue({
      id: 'm1',
      direction: 'out',
      messageType: 'text',
      content: 'hola',
      sentAt: new Date(),
    }),
    findByConversationId: jest.fn().mockResolvedValue([]),
  } as unknown as jest.Mocked<WhatsappMessageRepository>;

  const contactsService = {} as unknown as jest.Mocked<ContactsService>;

  const whatsappSend = {
    sendText: jest.fn().mockResolvedValue('wamid.sent'),
  } as unknown as jest.Mocked<WhatsappSendService>;

  const igConversationsRepo = {
    findById: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<InstagramConversationRepository>;

  const igMessagesRepo = {
    create: jest.fn(),
    findByConversationId: jest.fn().mockResolvedValue([]),
  } as unknown as jest.Mocked<InstagramMessageRepository>;

  const instagramSend = {
    sendText: jest.fn().mockResolvedValue('ig.mid.sent'),
  } as unknown as jest.Mocked<InstagramSendService>;

  const messengerConversationsRepo = {
    findById: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<MessengerConversationRepository>;

  const messengerMessagesRepo = {
    create: jest.fn(),
    findByConversationId: jest.fn().mockResolvedValue([]),
  } as unknown as jest.Mocked<MessengerMessageRepository>;

  const messengerSend = {
    sendText: jest.fn().mockResolvedValue('fb.mid.sent'),
  } as unknown as jest.Mocked<MessengerSendService>;

  const assignmentRepo = {
    findByConversationIds: jest.fn().mockResolvedValue([]),
    findByConversationId: jest.fn().mockResolvedValue(null),
    upsert: jest.fn(),
  } as unknown as jest.Mocked<ConversationAssignmentRepository>;

  const conversationRatings = {
    aggregateCsat: jest
      .fn()
      .mockResolvedValue({ count: 0, average: null, distribution: {} }),
    create: jest.fn(),
  } as unknown as jest.Mocked<ConversationRatingsService>;

  const conversationStates = {
    findByConversation: jest.fn().mockResolvedValue(null),
    findByBrand: jest.fn().mockResolvedValue([]),
    setStatus: jest.fn().mockResolvedValue({ status: 'resolved' }),
  } as unknown as jest.Mocked<ConversationStatesService>;

  const service = new SocialInboxService(
    connectionsRepo,
    conversationsRepo,
    messagesRepo,
    igConversationsRepo,
    igMessagesRepo,
    messengerConversationsRepo,
    messengerMessagesRepo,
    contactsService,
    whatsappSend,
    instagramSend,
    messengerSend,
    assignmentRepo,
    conversationRatings,
    conversationStates,
  );
  return {
    service,
    connectionsRepo,
    conversationsRepo,
    messagesRepo,
    igConversationsRepo,
    igMessagesRepo,
    messengerConversationsRepo,
    messengerMessagesRepo,
    whatsappSend,
    instagramSend,
    messengerSend,
    assignmentRepo,
    conversationRatings,
    conversationStates,
  };
};

describe('SocialInboxService.setConversationStatus', () => {
  it('should brand-scope, stamp status and emit realtime', async () => {
    const { service, conversationStates } = makeService();
    const realtime = { emitConversationUpdated: jest.fn() };
    (service as unknown as { realtime: unknown }).realtime = realtime;

    await service.setConversationStatus(7, 'conv1', 'whatsapp', 'resolved', 1);

    expect(conversationStates.setStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        brandId: 7,
        conversationId: 'conv1',
        channel: 'whatsapp',
        status: 'resolved',
        userId: 1,
      }),
    );
    expect(realtime.emitConversationUpdated).toHaveBeenCalled();
  });

  it('should reject an unsupported channel', async () => {
    const { service } = makeService();
    await expect(
      service.setConversationStatus(7, 'conv1', 'tiktok', 'resolved', 1),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('SocialInboxService.submitRating', () => {
  it('should attribute the rating to the resolver (agentUserId)', async () => {
    const { service, conversationStates, conversationRatings } = makeService();
    (conversationStates.findByConversation as jest.Mock).mockResolvedValue({
      resolvedByUserId: 42,
    });

    await service.submitRating(7, 'conv1', { channel: 'whatsapp', score: 5 });

    expect(conversationRatings.create).toHaveBeenCalledWith(
      expect.objectContaining({ agentUserId: 42, score: 5 }),
    );
  });

  it('should fall back to the assignee when not yet resolved', async () => {
    const { service, conversationStates, assignmentRepo, conversationRatings } =
      makeService();
    (conversationStates.findByConversation as jest.Mock).mockResolvedValue(
      null,
    );
    (assignmentRepo.findByConversationId as jest.Mock).mockResolvedValue({
      assignedUserId: 99,
    });

    await service.submitRating(7, 'conv1', { channel: 'whatsapp', score: 4 });

    expect(conversationRatings.create).toHaveBeenCalledWith(
      expect.objectContaining({ agentUserId: 99 }),
    );
  });
});

describe('SocialInboxService.sendMessage', () => {
  it('should send via Cloud API and mirror the outbound message', async () => {
    const { service, messagesRepo, conversationsRepo, whatsappSend } =
      makeService();

    const result = await service.sendMessage(7, 'conv1', 'whatsapp', 'hola');

    expect(whatsappSend.sendText).toHaveBeenCalledWith(
      CONNECTION,
      '16505551234',
      'hola',
    );
    expect(messagesRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        externalId: 'wamid.sent',
        direction: 'out',
        source: 'live',
        content: 'hola',
      }),
    );
    expect(conversationsRepo.update).toHaveBeenCalled();
    expect(result.direction).toBe('out');
  });

  it('should reject empty text', async () => {
    const { service, whatsappSend } = makeService();
    await expect(
      service.sendMessage(7, 'conv1', 'whatsapp', '   '),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(whatsappSend.sendText).not.toHaveBeenCalled();
  });

  it('should reject an unsupported channel', async () => {
    const { service } = makeService();
    await expect(
      service.sendMessage(7, 'conv1', 'tiktok', 'hola'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should send via Instagram and mirror the outbound message', async () => {
    const { service, igConversationsRepo, igMessagesRepo, instagramSend } =
      makeService();
    igConversationsRepo.findById.mockResolvedValue({
      id: 'igconv1',
      connectionId: 5,
      igUserId: 'IGSID123',
    } as never);
    igMessagesRepo.create.mockResolvedValue({
      id: 'igm1',
      direction: 'out',
      messageType: 'text',
      content: 'hola',
      sentAt: new Date(),
    } as never);

    const result = await service.sendMessage(7, 'igconv1', 'instagram', 'hola');

    expect(instagramSend.sendText).toHaveBeenCalledWith(
      { id: 5, brandId: 7, accountId: 'PNID', accountHandle: '+1' },
      'IGSID123',
      'hola',
    );
    expect(igMessagesRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        externalId: 'ig.mid.sent',
        direction: 'out',
        source: 'live',
        content: 'hola',
      }),
    );
    expect(igConversationsRepo.update).toHaveBeenCalled();
    expect(result.direction).toBe('out');
  });

  it('should send via Messenger and mirror the outbound message', async () => {
    const {
      service,
      messengerConversationsRepo,
      messengerMessagesRepo,
      messengerSend,
    } = makeService();
    messengerConversationsRepo.findById.mockResolvedValue({
      id: 'fbconv1',
      connectionId: 5,
      psid: 'PSID123',
    } as never);
    messengerMessagesRepo.create.mockResolvedValue({
      id: 'fbm1',
      direction: 'out',
      messageType: 'text',
      content: 'hola',
      sentAt: new Date(),
    } as never);

    const result = await service.sendMessage(
      7,
      'fbconv1',
      'facebook_page',
      'hola',
    );

    expect(messengerSend.sendText).toHaveBeenCalledWith(
      { id: 5, brandId: 7, accountId: 'PNID', accountHandle: '+1' },
      'PSID123',
      'hola',
    );
    expect(messengerMessagesRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        externalId: 'fb.mid.sent',
        direction: 'out',
        source: 'live',
        content: 'hola',
      }),
    );
    expect(messengerConversationsRepo.update).toHaveBeenCalled();
    expect(result.direction).toBe('out');
  });

  it('should 404 when the conversation belongs to another brand', async () => {
    const { service, connectionsRepo } = makeService();
    connectionsRepo.findById.mockResolvedValue({
      id: 5,
      brandId: 999,
    } as never);
    await expect(
      service.sendMessage(7, 'conv1', 'whatsapp', 'hola'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('SocialInboxService.conversationMetrics', () => {
  const convos = [
    {
      id: 'a',
      channel: 'whatsapp',
      lastMessageAt: new Date('2026-10-18T10:00:00Z'),
      assignment: { userId: 1, teamId: null },
    },
    {
      id: 'b',
      channel: 'whatsapp',
      lastMessageAt: new Date('2026-10-10T10:00:00Z'),
      assignment: null,
    },
    {
      id: 'c',
      channel: 'instagram',
      lastMessageAt: new Date('2026-10-18T12:00:00Z'),
      assignment: { userId: null, teamId: 't1' },
    },
  ];

  it('should aggregate volume, channel split and assignment (all-time)', async () => {
    const { service } = makeService();
    jest.spyOn(service, 'listConversations').mockResolvedValue(convos as never);

    const m = await service.conversationMetrics(7);

    expect(m.conversations.total).toBe(3);
    expect(m.conversations.active).toBe(3);
    expect(m.conversations.byChannel).toEqual({ whatsapp: 2, instagram: 1 });
    expect(m.conversations.assigned).toBe(2);
    expect(m.conversations.unassigned).toBe(1);
    expect(m.csat).toEqual({ count: 0, average: null, distribution: {} });
  });

  it('should count only conversations active within [from, to]', async () => {
    const { service } = makeService();
    jest.spyOn(service, 'listConversations').mockResolvedValue(convos as never);

    const m = await service.conversationMetrics(7, {
      from: new Date('2026-10-15T00:00:00Z'),
      to: new Date('2026-10-19T00:00:00Z'),
    });

    // 'b' (Oct 10) is outside the window; 'a' and 'c' remain.
    expect(m.conversations.total).toBe(3);
    expect(m.conversations.active).toBe(2);
    expect(m.conversations.byChannel).toEqual({ whatsapp: 1, instagram: 1 });
    expect(m.conversations.assigned).toBe(2);
  });

  it('should derive byStatus, response time and volume series', async () => {
    const { service, conversationStates, messagesRepo } = makeService();
    jest
      .spyOn(service, 'listConversations')
      .mockResolvedValue([convos[0]] as never); // only 'a' (whatsapp)

    // 'a' resolved by user 1 on Oct 18.
    (conversationStates.findByBrand as jest.Mock).mockResolvedValue([
      {
        conversationId: 'a',
        status: 'resolved',
        resolvedAt: new Date('2026-10-18T15:00:00Z'),
      },
    ]);
    // Inbound at 10:00, first reply at 10:03 → 180s.
    (messagesRepo.findByConversationId as jest.Mock).mockResolvedValue([
      { direction: 'in', sentAt: new Date('2026-10-18T10:00:00Z') },
      { direction: 'out', sentAt: new Date('2026-10-18T10:03:00Z') },
    ]);

    const m = await service.conversationMetrics(7);

    expect(m.byStatus.resolved).toBe(1);
    expect(m.responseTime.medianSeconds).toBe(180);
    expect(m.responseTime.distribution).toEqual({ '1-5m': 1 });
    expect(m.volumeSeries).toEqual([
      { date: '2026-10-18', created: 1, resolved: 1 },
    ]);
  });
});
