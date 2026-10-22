import { lastValueFrom, of } from 'rxjs';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { IdempotencyService } from './idempotency.service';

const makeCtx = (headers: Record<string, string>, brand?: { id: number }) => {
  const res = { statusCode: 201, status: jest.fn(), setHeader: jest.fn() };
  return {
    ctx: {
      switchToHttp: () => ({
        getRequest: () => ({ headers, brand }),
        getResponse: () => res,
      }),
    } as never,
    res,
  };
};

describe('IdempotencyInterceptor', () => {
  it('should pass through when no Idempotency-Key header', async () => {
    const svc = {
      get: jest.fn(),
      store: jest.fn(),
    } as unknown as IdempotencyService;
    const interceptor = new IdempotencyInterceptor(svc);
    const { ctx } = makeCtx({}, { id: 7 });

    const obs = await interceptor.intercept(ctx, {
      handle: () => of({ id: 'c1' }),
    });
    await lastValueFrom(obs);

    expect(svc.get).not.toHaveBeenCalled();
  });

  it('should replay the cached response on a key hit', async () => {
    const cached = { statusCode: 201, body: { id: 'c1', created: true } };
    const svc = {
      get: jest.fn().mockResolvedValue(cached),
      store: jest.fn(),
    } as unknown as IdempotencyService;
    const interceptor = new IdempotencyInterceptor(svc);
    const { ctx, res } = makeCtx({ 'idempotency-key': 'abc' }, { id: 7 });

    const handle = jest.fn();
    const obs = await interceptor.intercept(ctx, { handle });
    const body = await lastValueFrom(obs);

    expect(handle).not.toHaveBeenCalled(); // short-circuited
    expect(res.status).toHaveBeenCalledWith(201);
    expect(body).toEqual({ id: 'c1', created: true });
  });

  it('should store the response on a key miss', async () => {
    const svc = {
      get: jest.fn().mockResolvedValue(null),
      store: jest.fn().mockResolvedValue(undefined),
    } as unknown as IdempotencyService;
    const interceptor = new IdempotencyInterceptor(svc);
    const { ctx } = makeCtx({ 'idempotency-key': 'abc' }, { id: 7 });

    const obs = await interceptor.intercept(ctx, {
      handle: () => of({ id: 'c9' }),
    });
    await lastValueFrom(obs);

    expect(svc.store).toHaveBeenCalledWith(7, 'abc', {
      statusCode: 201,
      body: { id: 'c9' },
    });
  });
});
