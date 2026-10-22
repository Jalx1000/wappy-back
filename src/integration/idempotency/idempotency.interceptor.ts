import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { IdempotencyService } from './idempotency.service';

/**
 * Replays the first response for a repeated `Idempotency-Key` (per brand), so a
 * retried POST does not create duplicates. No header → passes through untouched.
 * Requires `req.brand` (set by ApiKeyGuard, which runs first).
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly idempotency: IdempotencyService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const key = req.headers['idempotency-key'] as string | undefined;
    const brandId = req.brand?.id as number | undefined;

    if (!key || brandId == null) {
      return next.handle();
    }

    const cached = await this.idempotency.get(brandId, key);
    if (cached) {
      res.status(cached.statusCode);
      res.setHeader('Idempotent-Replayed', 'true');
      return of(cached.body);
    }

    return next.handle().pipe(
      tap((body) => {
        void this.idempotency.store(brandId, key, {
          statusCode: res.statusCode,
          body,
        });
      }),
    );
  }
}
