import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;
  private readonly algorithm = 'aes-256-gcm';

  constructor(private readonly configService: ConfigService) {
    // flat env key, not part of the typed config namespace
    // eslint-disable-next-line no-restricted-syntax
    const hex = this.configService.getOrThrow<string>('ENCRYPTION_KEY');
    this.key = Buffer.from(hex, 'hex');
  }

  encrypt(plain: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plain, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    // iv:tag:ciphertext — all hex
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(ciphertext: string): string {
    const [ivHex, tagHex, dataHex] = ciphertext.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const data = Buffer.from(dataHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(data) + decipher.final('utf8');
  }

  /**
   * Returns the plaintext, tolerating values that were stored unencrypted. If
   * `value` is not in the encrypted `iv:tag:data` hex format (e.g. a raw token),
   * it is returned unchanged instead of throwing.
   */
  decryptSafe(value: string): string {
    if (!value || !/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/i.test(value)) {
      return value;
    }
    try {
      return this.decrypt(value);
    } catch {
      return value;
    }
  }
}
