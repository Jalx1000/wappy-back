import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { MessengerWebhookService } from './messenger-webhook.service';
import { MessengerIngestService } from './messenger-ingest.service';

const APP_SECRET = 'test-app-secret';
const VERIFY_TOKEN = 'verify-me';

const makeService = () => {
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'META_MESSENGER_WEBHOOK_VERIFY_TOKEN') return VERIFY_TOKEN;
      if (key === 'META_APP_SECRET') return APP_SECRET;
      return undefined;
    }),
  } as unknown as ConfigService;

  const ingest = {
    handleMessaging: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<MessengerIngestService>;

  return { service: new MessengerWebhookService(config, ingest), ingest };
};

const sign = (body: string) =>
  'sha256=' +
  crypto
    .createHmac('sha256', APP_SECRET)
    .update(Buffer.from(body))
    .digest('hex');

describe('MessengerWebhookService', () => {
  it('should echo the challenge when the verify token matches', () => {
    const { service } = makeService();
    expect(service.verify('subscribe', VERIFY_TOKEN, '12345')).toBe('12345');
  });

  it('should reject a bad verify token', () => {
    const { service } = makeService();
    expect(() => service.verify('subscribe', 'wrong', '12345')).toThrow(
      ForbiddenException,
    );
  });

  it('should ignore a payload with an invalid signature', async () => {
    const { service, ingest } = makeService();
    const body = JSON.stringify({ object: 'page', entry: [] });
    await service.handle(Buffer.from(body), 'sha256=deadbeef');
    expect(ingest.handleMessaging).not.toHaveBeenCalled();
  });

  it('should route each messaging item to the ingest on a valid signature', async () => {
    const { service, ingest } = makeService();
    const payload = {
      object: 'page',
      entry: [
        {
          id: 'PAGE_ID',
          messaging: [
            {
              sender: { id: 'PSID1' },
              recipient: { id: 'PAGE_ID' },
              message: { mid: 'm1', text: 'hola' },
            },
            {
              sender: { id: 'PSID2' },
              recipient: { id: 'PAGE_ID' },
              message: { mid: 'm2', text: 'hi' },
            },
          ],
        },
      ],
    };
    const body = JSON.stringify(payload);
    await service.handle(Buffer.from(body), sign(body));
    expect(ingest.handleMessaging).toHaveBeenCalledTimes(2);
    expect(ingest.handleMessaging).toHaveBeenCalledWith(
      'PAGE_ID',
      expect.objectContaining({
        message: expect.objectContaining({ mid: 'm1' }),
      }),
    );
  });

  it('should ignore non-page objects (e.g. instagram)', async () => {
    const { service, ingest } = makeService();
    const body = JSON.stringify({ object: 'instagram', entry: [] });
    await service.handle(Buffer.from(body), sign(body));
    expect(ingest.handleMessaging).not.toHaveBeenCalled();
  });
});
