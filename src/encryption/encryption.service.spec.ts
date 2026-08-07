import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';

const KEY = '3c357bbb5d4c6c9e4629c4369f82ae52c5c467b6489757fe0439cb51adea70ef';

const make = () =>
  new EncryptionService({
    getOrThrow: () => KEY,
  } as unknown as ConfigService);

describe('EncryptionService.decryptSafe', () => {
  it('should round-trip an encrypted value', () => {
    const svc = make();
    const enc = svc.encrypt('EAAtoken123');
    expect(enc).toMatch(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/);
    expect(svc.decryptSafe(enc)).toBe('EAAtoken123');
  });

  it('should return a raw (unencrypted) token unchanged', () => {
    const svc = make();
    expect(svc.decryptSafe('EAAOT8fdLjvsRawToken')).toBe(
      'EAAOT8fdLjvsRawToken',
    );
  });

  it('should return an empty string unchanged without throwing', () => {
    const svc = make();
    expect(svc.decryptSafe('')).toBe('');
  });
});
