import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';
import { WhatsappWebhookService } from './whatsapp-webhook.service';
import { WhatsappIngestService } from './whatsapp-ingest.service';

const APP_SECRET = 'test-app-secret';
const VERIFY_TOKEN = 'test-verify-token';

const CONFIG_VALUES: Record<string, string> = {
  META_APP_SECRET: APP_SECRET,
  META_WHATSAPP_WEBHOOK_VERIFY_TOKEN: VERIFY_TOKEN,
};

const makeService = () => {
  const config = {
    get: (key: string) => CONFIG_VALUES[key],
  } as unknown as ConfigService;
  const ingest = {
    handleChange: jest.fn().mockResolvedValue(undefined),
  } as unknown as WhatsappIngestService;
  const queue = {
    add: jest.fn().mockResolvedValue(undefined),
  } as unknown as Queue;
  return new WhatsappWebhookService(config, ingest, queue);
};

const sign = (body: Buffer) =>
  'sha256=' +
  crypto.createHmac('sha256', APP_SECRET).update(body).digest('hex');

type RouteSpy = { route: () => Promise<void> };
const spyRoute = (service: WhatsappWebhookService) =>
  jest
    .spyOn(service as unknown as RouteSpy, 'route')
    .mockResolvedValue(undefined);

describe('WhatsappWebhookService', () => {
  describe('verify (GET handshake)', () => {
    it('should echo the challenge when mode=subscribe and token matches', () => {
      const service = makeService();
      expect(service.verify('subscribe', VERIFY_TOKEN, '12345')).toBe('12345');
    });

    it('should throw when the verify token does not match', () => {
      const service = makeService();
      expect(() => service.verify('subscribe', 'wrong', '12345')).toThrow(
        ForbiddenException,
      );
    });

    it('should throw when mode is not subscribe', () => {
      const service = makeService();
      expect(() =>
        service.verify('unsubscribe', VERIFY_TOKEN, '12345'),
      ).toThrow(ForbiddenException);
    });
  });

  describe('handle (POST signature over raw body)', () => {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [{ id: 'WABA1', changes: [{ field: 'history', value: {} }] }],
    };
    const body = Buffer.from(JSON.stringify(payload), 'utf8');

    it('should route the payload when the signature is valid', async () => {
      const service = makeService();
      const route = spyRoute(service);
      await service.handle(body, sign(body));
      expect(route).toHaveBeenCalledTimes(1);
      expect(route).toHaveBeenCalledWith(payload);
    });

    it('should ignore a tampered body (same-length wrong signature)', async () => {
      const service = makeService();
      const route = spyRoute(service);
      // Signature computed over different bytes → same length, wrong digest.
      await service.handle(body, sign(Buffer.from('tampered')));
      expect(route).not.toHaveBeenCalled();
    });

    it('should ignore when the signature header is missing', async () => {
      const service = makeService();
      const route = spyRoute(service);
      await service.handle(body, undefined);
      expect(route).not.toHaveBeenCalled();
    });
  });
});
