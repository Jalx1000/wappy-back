import { WhatsappIngestService } from './whatsapp-ingest.service';
import { ConnectionsRepository } from '../connections/infrastructure/persistence/relational/repositories/connections.repository';
import { ContactsService } from '../contacts/contacts.service';
import { WhatsappConversationRepository } from '../whatsapp-conversations/infrastructure/persistence/whatsapp-conversation.repository';
import { WhatsappMessageRepository } from '../whatsapp-messages/infrastructure/persistence/whatsapp-message.repository';

const CONNECTION = { id: 10, brandId: 7 };
const META = { metadata: { phone_number_id: 'PNID' } };

const makeService = () => {
  const connectionsRepo = {
    findByChannelAndAccount: jest.fn().mockResolvedValue([CONNECTION]),
  } as unknown as jest.Mocked<ConnectionsRepository>;

  const contactsService = {
    upsertIdentity: jest
      .fn()
      .mockResolvedValue({ contact: { id: 'c1' }, identity: { id: 'i1' } }),
  } as unknown as jest.Mocked<ContactsService>;

  const conversationsRepo = {
    findByConnectionAndUser: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 'conv1' }),
    update: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<WhatsappConversationRepository>;

  const messagesRepo = {
    findByConnectionAndExternalId: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 'm1' }),
    update: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<WhatsappMessageRepository>;

  const service = new WhatsappIngestService(
    connectionsRepo,
    contactsService,
    conversationsRepo,
    messagesRepo,
  );
  return {
    service,
    connectionsRepo,
    contactsService,
    conversationsRepo,
    messagesRepo,
  };
};

describe('WhatsappIngestService', () => {
  it('should do nothing when no connection matches the phone_number_id', async () => {
    const { service, connectionsRepo, contactsService } = makeService();
    connectionsRepo.findByChannelAndAccount.mockResolvedValue([]);
    await service.handleChange('smb_app_state_sync', {
      ...META,
      state_sync: [
        { type: 'contact', action: 'add', contact: { phone_number: '1' } },
      ],
    });
    expect(contactsService.upsertIdentity).not.toHaveBeenCalled();
  });

  it('should upsert a central identity from smb_app_state_sync (add)', async () => {
    const { service, contactsService } = makeService();
    await service.handleChange('smb_app_state_sync', {
      ...META,
      state_sync: [
        {
          type: 'contact',
          action: 'add',
          contact: { full_name: 'Pablo Morales', phone_number: '16505551234' },
        },
      ],
    });
    expect(contactsService.upsertIdentity).toHaveBeenCalledWith(
      expect.objectContaining({
        brandId: 7,
        channel: 'whatsapp',
        connectionId: 10,
        externalId: '16505551234',
        profileName: 'Pablo Morales',
      }),
    );
  });

  it('should mirror an outgoing echo: create conversation + message (out)', async () => {
    const { service, conversationsRepo, messagesRepo } = makeService();
    await service.handleChange('smb_message_echoes', {
      ...META,
      message_echoes: [
        {
          to: '16505551234',
          id: 'wamid.echo1',
          timestamp: '1700000000',
          type: 'text',
          text: { body: 'hola' },
        },
      ],
    });
    expect(conversationsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionId: 10,
        waUserPhone: '16505551234',
        contactId: 'c1',
      }),
    );
    expect(messagesRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        externalId: 'wamid.echo1',
        direction: 'out',
        source: 'echo',
        content: 'hola',
        conversationId: 'conv1',
      }),
    );
  });

  it('should mirror an inbound message (in) into an existing conversation', async () => {
    const { service, conversationsRepo, messagesRepo } = makeService();
    conversationsRepo.findByConnectionAndUser.mockResolvedValue({
      id: 'conv1',
    } as never);
    await service.handleChange('messages', {
      ...META,
      messages: [
        {
          from: '16505551234',
          id: 'wamid.in1',
          timestamp: '1700000001',
          type: 'text',
          text: { body: 'buenas' },
        },
      ],
    });
    expect(conversationsRepo.create).not.toHaveBeenCalled();
    expect(messagesRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        externalId: 'wamid.in1',
        direction: 'in',
        source: 'live',
        content: 'buenas',
      }),
    );
  });

  it('should skip an already-ingested message (idempotency)', async () => {
    const { service, messagesRepo } = makeService();
    messagesRepo.findByConnectionAndExternalId.mockResolvedValue({
      id: 'existing',
    } as never);
    await service.handleChange('smb_message_echoes', {
      ...META,
      message_echoes: [
        { to: '1', id: 'wamid.dup', timestamp: '1', type: 'text', text: {} },
      ],
    });
    expect(messagesRepo.create).not.toHaveBeenCalled();
  });

  it('should revoke an existing message', async () => {
    const { service, messagesRepo } = makeService();
    messagesRepo.findByConnectionAndExternalId.mockResolvedValue({
      id: 'm1',
    } as never);
    await service.handleChange('messages', {
      ...META,
      messages: [
        { type: 'revoke', revoke: { original_message_id: 'wamid.echo1' } },
      ],
    });
    expect(messagesRepo.update).toHaveBeenCalledWith(
      'm1',
      expect.objectContaining({ revokedAt: expect.any(Date) }),
    );
  });
});

describe('WhatsappIngestService.ingestHistory', () => {
  const HISTORY_META = {
    metadata: {
      phone_number_id: 'PNID',
      display_phone_number: '15550000000',
    },
  };

  it('should persist history messages with direction from the business phone', async () => {
    const { service, messagesRepo } = makeService();
    await service.ingestHistory({
      ...HISTORY_META,
      history: [
        {
          metadata: { phase: 0, chunk_order: 1, progress: 55 },
          threads: [
            {
              id: '16505551234',
              messages: [
                {
                  from: '15550000000',
                  id: 'wamid.h1',
                  timestamp: '1739230955',
                  type: 'text',
                  text: { body: 'hola' },
                },
                {
                  from: '16505551234',
                  id: 'wamid.h2',
                  timestamp: '1739230970',
                  type: 'text',
                  text: { body: 'gracias' },
                },
              ],
            },
          ],
        },
      ],
    });
    expect(messagesRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        externalId: 'wamid.h1',
        direction: 'out',
        source: 'history',
      }),
    );
    expect(messagesRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ externalId: 'wamid.h2', direction: 'in' }),
    );
  });

  it('should not create messages when history sharing was declined (2593109)', async () => {
    const { service, messagesRepo } = makeService();
    await service.ingestHistory({
      ...HISTORY_META,
      history: [
        { errors: [{ code: 2593109, title: 'History sync is turned off' }] },
      ],
    });
    expect(messagesRepo.create).not.toHaveBeenCalled();
  });

  it('should enrich a stored placeholder from a media-asset follow-up', async () => {
    const { service, messagesRepo } = makeService();
    messagesRepo.findByConnectionAndExternalId.mockResolvedValue({
      id: 'm1',
      messageType: 'media_placeholder',
      content: null,
    } as never);
    await service.ingestHistory({
      ...HISTORY_META,
      messages: [
        {
          id: 'wamid.h2',
          type: 'image',
          image: { id: 'media123', caption: 'foto' },
        },
      ],
    });
    expect(messagesRepo.update).toHaveBeenCalledWith(
      'm1',
      expect.objectContaining({ mediaId: 'media123', content: 'foto' }),
    );
  });
});

describe('WhatsappIngestService message-type detection', () => {
  const inbound = (msg: Record<string, unknown>) => ({
    ...META,
    messages: [{ from: '16505551234', timestamp: '1700000000', ...msg }],
  });

  it('should detect an image with caption', async () => {
    const { service, messagesRepo } = makeService();
    await service.handleChange(
      'messages',
      inbound({
        id: 'wamid.img',
        type: 'image',
        image: { id: 'MID', mime_type: 'image/jpeg', caption: 'mi foto' },
      }),
    );
    expect(messagesRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messageType: 'image',
        content: 'mi foto',
        mediaId: 'MID',
        payload: expect.objectContaining({ mime_type: 'image/jpeg' }),
      }),
    );
  });

  it('should detect a document with filename + caption', async () => {
    const { service, messagesRepo } = makeService();
    await service.handleChange(
      'messages',
      inbound({
        id: 'wamid.doc',
        type: 'document',
        document: {
          id: 'DID',
          mime_type: 'application/pdf',
          filename: 'factura.pdf',
          caption: 'tu factura',
        },
      }),
    );
    expect(messagesRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messageType: 'document',
        content: 'tu factura',
        mediaId: 'DID',
        payload: expect.objectContaining({ filename: 'factura.pdf' }),
      }),
    );
  });

  it('should detect an audio message', async () => {
    const { service, messagesRepo } = makeService();
    await service.handleChange(
      'messages',
      inbound({
        id: 'wamid.aud',
        type: 'audio',
        audio: { id: 'AID', mime_type: 'audio/ogg', voice: true },
      }),
    );
    expect(messagesRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messageType: 'audio',
        mediaId: 'AID',
        content: null,
      }),
    );
  });

  it('should detect a location with coordinates', async () => {
    const { service, messagesRepo } = makeService();
    await service.handleChange(
      'messages',
      inbound({
        id: 'wamid.loc',
        type: 'location',
        location: {
          latitude: '-17.78',
          longitude: '-63.18',
          name: 'Plaza 24',
          address: 'Santa Cruz',
        },
      }),
    );
    expect(messagesRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messageType: 'location',
        content: 'Plaza 24 · Santa Cruz',
        payload: expect.objectContaining({ latitude: '-17.78' }),
      }),
    );
  });
});
