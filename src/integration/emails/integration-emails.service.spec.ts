import { BadRequestException } from '@nestjs/common';
import { IntegrationEmailsService } from './integration-emails.service';
import { MailerService } from '../../mailer/mailer.service';
import { ConfigService } from '@nestjs/config';

const makeService = () => {
  const mailer = {
    sendMail: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<MailerService>;
  const config = {
    getOrThrow: jest.fn().mockReturnValue('/app'),
  } as unknown as ConfigService;
  return { service: new IntegrationEmailsService(mailer, config), mailer };
};

describe('IntegrationEmailsService.send', () => {
  it('should send a known template merging defaults with variables', async () => {
    const { service, mailer } = makeService();

    const res = await service.send({
      to: 'ana@example.com',
      template: 'bienvenida',
      variables: { nombre: 'Ana' },
      replyTo: 'ventas@yiyi.lat',
    });

    expect(res).toEqual({ sent: true, template: 'bienvenida' });
    const call = (mailer.sendMail as jest.Mock).mock.calls[0][0];
    expect(call.to).toBe('ana@example.com');
    expect(call.subject).toContain('Bienvenido');
    expect(call.replyTo).toBe('ventas@yiyi.lat');
    expect(call.templatePath).toContain('bienvenida.hbs');
    // default + override merged
    expect(call.context.nombre).toBe('Ana');
    expect(call.context.url_tienda).toBe('https://www.yiyi.lat/tienda');
  });

  it('should reject an unknown template', async () => {
    const { service } = makeService();
    await expect(
      service.send({ to: 'a@b.com', template: 'nope' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should send a raw subject + html', async () => {
    const { service, mailer } = makeService();

    const res = await service.send({
      to: 'a@b.com',
      subject: 'Hola',
      html: '<p>Hola</p>',
    });

    expect(res).toEqual({ sent: true, template: null });
    const call = (mailer.sendMail as jest.Mock).mock.calls[0][0];
    expect(call.html).toBe('<p>Hola</p>');
    expect(call.templatePath).toBe('');
  });

  it('should reject when neither template nor subject+html given', async () => {
    const { service } = makeService();
    await expect(service.send({ to: 'a@b.com' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
