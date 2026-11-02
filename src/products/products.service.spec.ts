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
