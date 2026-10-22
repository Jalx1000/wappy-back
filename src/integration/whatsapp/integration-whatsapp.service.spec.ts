import { BadRequestException } from '@nestjs/common';
import { IntegrationWhatsappService } from './integration-whatsapp.service';
import { WhatsappSendService } from '../../social-inbox/whatsapp-send.service';
import { ConnectionsRepository } from '../../connections/infrastructure/persistence/relational/repositories/connections.repository';

const WA_CONN = { id: 5, brandId: 7, channel: 'whatsapp', accountId: 'PNID' };

const makeService = (connections: unknown[]) => {
  const whatsappSend = {
    sendTemplate: jest.fn().mockResolvedValue('wamid.tpl'),
    sendText: jest.fn().mockResolvedValue('wamid.txt'),
  } as unknown as jest.Mocked<WhatsappSendService>;
  const connectionsRepo = {
    findByBrandId: jest.fn().mockResolvedValue(connections),
  } as unknown as jest.Mocked<ConnectionsRepository>;
  return {
    service: new IntegrationWhatsappService(whatsappSend, connectionsRepo),
    whatsappSend,
  };
};

describe('IntegrationWhatsappService.send', () => {
  it('should send a template with positional params via the brand WhatsApp connection', async () => {
    const { service, whatsappSend } = makeService([WA_CONN]);

    const res = await service.send(7, {
      to: '+59170000000',
      template: 'confirmacion_pedido',
      params: ['Ana', '#1023', 'Bs 350'],
    });

    expect(whatsappSend.sendTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 5 }),
      '+59170000000',
      'confirmacion_pedido',
      'es',
      ['Ana', '#1023', 'Bs 350'],
    );
    expect(res).toEqual({ sent: true, wamid: 'wamid.tpl' });
  });

  it('should send free text when no template given', async () => {
    const { service, whatsappSend } = makeService([WA_CONN]);
    const res = await service.send(7, { to: '+591700', text: 'hola' });
    expect(whatsappSend.sendText).toHaveBeenCalled();
    expect(res.wamid).toBe('wamid.txt');
  });

  it('should reject when the brand has no WhatsApp connection', async () => {
    const { service } = makeService([{ id: 9, channel: 'instagram' }]);
    await expect(
      service.send(7, { to: '+591', template: 't' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should reject when neither template nor text given', async () => {
    const { service } = makeService([WA_CONN]);
    await expect(service.send(7, { to: '+591' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
