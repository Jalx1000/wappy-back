import { NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { ApiKeysService } from './api-keys.service';
import { ApiKeyRepository } from './infrastructure/persistence/api-key.repository';
import { BrandsService } from '../brands/brands.service';

const sha = (s: string) => createHash('sha256').update(s).digest('hex');

const makeService = () => {
  const repo = {
    create: jest.fn((d) =>
      Promise.resolve({ id: 'k1', createdAt: new Date(), ...d }),
    ),
    findByHash: jest.fn(),
    findById: jest.fn(),
    findByBrand: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<ApiKeyRepository>;
  const brands = {
    getBrandById: jest.fn(),
  } as unknown as jest.Mocked<BrandsService>;
  return { service: new ApiKeysService(repo, brands), repo, brands };
};

describe('ApiKeysService.generateForBrand', () => {
  it('should store only the hash + masked prefix and return the plaintext once', async () => {
    const { service, repo } = makeService();
    const { apiKey, plaintext } = await service.generateForBrand(
      7,
      'production',
      'Yiyi',
    );

    expect(plaintext).toMatch(/^wppy_live_/);
    const created = (repo.create as jest.Mock).mock.calls[0][0];
    expect(created.brandId).toBe(7);
    expect(created.keyHash).toBe(sha(plaintext));
    expect(created.keyHash).not.toEqual(plaintext); // never store plaintext
    expect(created.keyPrefix).toContain('…');
    expect(apiKey.id).toBe('k1');
  });

  it('should use the test prefix for sandbox', async () => {
    const { service } = makeService();
    const { plaintext } = await service.generateForBrand(7, 'sandbox');
    expect(plaintext).toMatch(/^wppy_test_/);
  });
});

describe('ApiKeysService.resolveBrand', () => {
  it('should resolve the brand for a valid key and stamp lastUsedAt', async () => {
    const { service, repo, brands } = makeService();
    const plaintext = 'wppy_live_abc';
    (repo.findByHash as jest.Mock).mockResolvedValue({
      id: 'k1',
      brandId: 7,
      revokedAt: null,
    });
    (brands.getBrandById as jest.Mock).mockResolvedValue({
      id: 7,
      name: 'Yiyi',
    });

    const brand = await service.resolveBrand(plaintext);

    expect(repo.findByHash).toHaveBeenCalledWith(sha(plaintext));
    expect(brand).toEqual({ id: 7, name: 'Yiyi' });
    expect(repo.update).toHaveBeenCalledWith(
      'k1',
      expect.objectContaining({ lastUsedAt: expect.any(Date) }),
    );
  });

  it('should return null for an unknown key', async () => {
    const { service, repo } = makeService();
    (repo.findByHash as jest.Mock).mockResolvedValue(null);
    expect(await service.resolveBrand('nope')).toBeNull();
  });

  it('should return null for a revoked key', async () => {
    const { service, repo, brands } = makeService();
    (repo.findByHash as jest.Mock).mockResolvedValue({
      id: 'k1',
      brandId: 7,
      revokedAt: new Date(),
    });
    expect(await service.resolveBrand('wppy_live_x')).toBeNull();
    expect(brands.getBrandById).not.toHaveBeenCalled();
  });
});

describe('ApiKeysService.revokeForBrand', () => {
  it('should 404 when the key belongs to another brand', async () => {
    const { service, repo } = makeService();
    (repo.findById as jest.Mock).mockResolvedValue({ id: 'k1', brandId: 999 });
    await expect(service.revokeForBrand(7, 'k1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should soft-revoke an owned key', async () => {
    const { service, repo } = makeService();
    (repo.findById as jest.Mock).mockResolvedValue({
      id: 'k1',
      brandId: 7,
      revokedAt: null,
    });
    await service.revokeForBrand(7, 'k1');
    expect(repo.update).toHaveBeenCalledWith(
      'k1',
      expect.objectContaining({ revokedAt: expect.any(Date) }),
    );
  });
});
