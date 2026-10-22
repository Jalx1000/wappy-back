import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeysService } from '../api-keys.service';

/**
 * Auth for the public server-to-server integration API. Reads
 * `Authorization: Bearer <key>`, resolves the owning brand from the key hash and
 * attaches it as `req.brand` (same shape BrandGuard provides). No x-brand-id:
 * the key itself identifies the brand.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeys: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const header = req.headers['authorization'] as string | undefined;
    const key = header?.startsWith('Bearer ')
      ? header.slice(7).trim()
      : undefined;
    if (!key) {
      throw new UnauthorizedException({
        error: {
          code: 'missing_api_key',
          message: 'Authorization: Bearer <key> required',
        },
      });
    }
    const brand = await this.apiKeys.resolveBrand(key);
    if (!brand) {
      throw new UnauthorizedException({
        error: {
          code: 'invalid_api_key',
          message: 'API key is invalid or revoked',
        },
      });
    }
    req.brand = brand;
    return true;
  }
}
