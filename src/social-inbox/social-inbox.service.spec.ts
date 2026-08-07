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
import { WhatsappSendService } from './whatsapp-send.service';
import { InstagramSendService } from './instagram-send.service';
import { MessengerSendService } from './messenger-send.service';

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
    findByConversationId: jest.fn(),
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
    findByConversationId: jest.fn(),
  } as unknown as jest.Mocked<MessengerMessageRepository>;

  const messengerSend = {
    sendText: jest.fn().mockResolvedValue('fb.mid.sent'),
  } as unknown as jest.Mocked<MessengerSendService>;

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
  };
};

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
