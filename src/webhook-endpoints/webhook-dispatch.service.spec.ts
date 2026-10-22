import { createHmac } from 'crypto';
import axios from 'axios';
import { WebhookDispatchService } from './webhook-dispatch.service';
import { WebhookEndpointRepository } from './infrastructure/persistence/webhook-endpoint.repository';

jest.mock('axios');
const mockedPost = axios.post as jest.Mock;

const makeService = (endpoints: unknown[]) => {
  const repo = {
    findActiveByBrand: jest.fn().mockResolvedValue(endpoints),
  } as unknown as WebhookEndpointRepository;
  return new WebhookDispatchService(repo);
};

describe('WebhookDispatchService', () => {
  beforeEach(() => mockedPost.mockReset());

  it('should sign with HMAC-SHA256 so the receiver can verify', () => {
    const sig = WebhookDispatchService.sign('whsec_x', '{"a":1}');
    const expected = createHmac('sha256', 'whsec_x')
      .update('{"a":1}')
      .digest('hex');
    expect(sig).toBe(expected);
  });

  it('should POST the signed event to each active endpoint', async () => {
    mockedPost.mockResolvedValue({ status: 200 });
    const svc = makeService([
      { url: 'https://yiyi.lat/hook', secret: 'whsec_x' },
    ]);

    await svc.dispatch(7, 'email.bounced', { contact_id: 'c1' });

    expect(mockedPost).toHaveBeenCalledTimes(1);
    const [url, body, opts] = mockedPost.mock.calls[0];
    expect(url).toBe('https://yiyi.lat/hook');
    const parsed = JSON.parse(body);
    expect(parsed.event).toBe('email.bounced');
    expect(parsed.data).toEqual({ contact_id: 'c1' });
    // signature matches the exact raw body
    expect(opts.headers['X-Wappy-Signature']).toBe(
      createHmac('sha256', 'whsec_x').update(body).digest('hex'),
    );
  });

  it('should not throw when a delivery fails', async () => {
    mockedPost.mockRejectedValue(new Error('timeout'));
    const svc = makeService([{ url: 'https://x', secret: 's' }]);
    await expect(svc.dispatch(7, 'whatsapp.read', {})).resolves.toBeUndefined();
  });

  it('should skip when the brand has no active endpoints', async () => {
    const svc = makeService([]);
    await svc.dispatch(7, 'message.inbound', {});
    expect(mockedPost).not.toHaveBeenCalled();
  });
});
