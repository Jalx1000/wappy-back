import { ProductsService } from './products.service';
import { ProductRepository } from './infrastructure/persistence/product.repository';

const makeService = () => {
  const repo = {
    findByExternalId: jest.fn(),
    create: jest.fn((p) => Promise.resolve({ ...p, id: 'new-id' })),
    update: jest.fn((id, payload) => Promise.resolve({ id, ...payload })),
  } as unknown as jest.Mocked<ProductRepository>;
  const service = new ProductsService(repo);
  return { service, repo };
};

const base = {
  externalId: 'wc_128',
  sku: 'YIYI-ABC-123',
  name: 'ABC Magnéticos',
  price: 180,
  category: 'Didácticos y educativos',
  attributes: [
    {
      key: 'material',
      label: 'Material',
      type: 'text' as const,
      value: 'Madera',
    },
  ],
};

describe('ProductsService.upsertFromExternal (S2/S3)', () => {
  it('should create a new product when external_id is unseen (created:true)', async () => {
    const { service, repo } = makeService();
    (repo.findByExternalId as jest.Mock).mockResolvedValue(null);

    const { product, created } = await service.upsertFromExternal(7, base);

    expect(repo.findByExternalId).toHaveBeenCalledWith(7, 'wc_128');
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        externalId: 'wc_128',
        brandId: 7,
        name: 'ABC Magnéticos',
        attributes: base.attributes,
      }),
    );
    expect(created).toBe(true);
    expect(product.id).toBe('new-id');
  });

  it('should update in place when external_id already exists (created:false)', async () => {
    const { service, repo } = makeService();
    (repo.findByExternalId as jest.Mock).mockResolvedValue({
      id: 'existing',
      stock: 5,
    });

    const { created } = await service.upsertFromExternal(7, base);

    expect(repo.update).toHaveBeenCalledWith(
      'existing',
      expect.objectContaining({
        name: 'ABC Magnéticos',
        attributes: base.attributes,
      }),
    );
    expect(repo.create).not.toHaveBeenCalled();
    expect(created).toBe(false);
  });
});

describe('ProductsService.deactivateByExternalId (S4)', () => {
  it('should soft-delete an active product (isActive=false)', async () => {
    const { service, repo } = makeService();
    (repo.findByExternalId as jest.Mock).mockResolvedValue({
      id: 'existing',
      isActive: true,
    });

    const res = await service.deactivateByExternalId(7, 'wc_128');

    expect(repo.update).toHaveBeenCalledWith('existing', { isActive: false });
    expect(res).toEqual({ id: 'existing', deactivated: true });
  });

  it('should be idempotent when the product is already inactive', async () => {
    const { service, repo } = makeService();
    (repo.findByExternalId as jest.Mock).mockResolvedValue({
      id: 'existing',
      isActive: false,
    });

    const res = await service.deactivateByExternalId(7, 'wc_128');

    expect(repo.update).not.toHaveBeenCalled();
    expect(res).toEqual({ id: 'existing', deactivated: true });
  });

  it('should be idempotent when the external_id does not exist', async () => {
    const { service, repo } = makeService();
    (repo.findByExternalId as jest.Mock).mockResolvedValue(null);

    const res = await service.deactivateByExternalId(7, 'wc_999');

    expect(repo.update).not.toHaveBeenCalled();
    expect(res).toEqual({ id: null, deactivated: true });
  });
});
