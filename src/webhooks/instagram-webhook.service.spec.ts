import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { InstagramWebhookService } from './instagram-webhook.service';
import { InstagramIngestService } from './instagram-ingest.service';

const APP_SECRET = 'test-app-secret';
const VERIFY_TOKEN = 'verify-me';

const makeService = () => {
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'INSTAGRAM_LOGIN_WEBHOOK_VERIFY_TOKEN') return VERIFY_TOKEN;
      if (key === 'INSTAGRAM_LOGIN_APP_SECRET') return APP_SECRET;
      return undefined;
    }),
  } as unknown as ConfigService;

  const ingest = {
    handleMessaging: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<InstagramIngestService>;

  return { service: new InstagramWebhookService(config, ingest), ingest };
};

const sign = (body: string) =>
  'sha256=' +
  crypto
    .createHmac('sha256', APP_SECRET)
    .update(Buffer.from(body))
    .digest('hex');

describe('InstagramWebhookService', () => {
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
    const body = JSON.stringify({ object: 'instagram', entry: [] });
    await service.handle(Buffer.from(body), 'sha256=deadbeef');
    expect(ingest.handleMessaging).not.toHaveBeenCalled();
  });

  it('should route each messaging item to the ingest on a valid signature', async () => {
    const { service, ingest } = makeService();
    const payload = {
      object: 'instagram',
      entry: [
        {
          id: 'IG_ACCOUNT',
          messaging: [
            {
              sender: { id: 'IGSID' },
              recipient: { id: 'IG_ACCOUNT' },
              message: { mid: 'm1', text: 'hola' },
            },
            {
              sender: { id: 'IGSID2' },
              recipient: { id: 'IG_ACCOUNT' },
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
      'IG_ACCOUNT',
      expect.objectContaining({
        message: expect.objectContaining({ mid: 'm1' }),
      }),
    );
  });

  it('should ignore non-instagram objects', async () => {
    const { service, ingest } = makeService();
    const body = JSON.stringify({ object: 'page', entry: [] });
    await service.handle(Buffer.from(body), sign(body));
    expect(ingest.handleMessaging).not.toHaveBeenCalled();
  });
});
