import { ProductsService } from './products.service';
import { ProductRepository } from './infrastructure/persistence/product.repository';
import { WebhookDispatchService } from '../webhook-endpoints/webhook-dispatch.service';
import { CategoriesService } from '../categories/categories.service';

const makeService = () => {
  const repo = {
    findByExternalId: jest.fn(),
    findById: jest.fn(),
    create: jest.fn((p) => Promise.resolve({ ...p, id: 'new-id' })),
    update: jest.fn((id, payload) => Promise.resolve({ id, ...payload })),
    remove: jest.fn(() => Promise.resolve()),
  } as unknown as jest.Mocked<ProductRepository>;
  const dispatch = {
    dispatch: jest.fn(() => Promise.resolve()),
  } as unknown as jest.Mocked<WebhookDispatchService>;
  const categories = {
    findOrCreate: jest.fn(() => Promise.resolve({ id: 'cat1' })),
  } as unknown as jest.Mocked<CategoriesService>;
  const service = new ProductsService(repo, dispatch, categories);
  return { service, repo, dispatch, categories };
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

  it('should register the category in the brand taxonomy on upsert (S2)', async () => {
    const { service, repo, categories } = makeService();
    (repo.findByExternalId as jest.Mock).mockResolvedValue(null);

    await service.upsertFromExternal(7, base);

    expect(categories.findOrCreate).toHaveBeenCalledWith(
      7,
      'Didácticos y educativos',
    );
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

describe('ProductsService webhook emission (S5/S6)', () => {
  const dashboardDto = {
    sku: 'WAP-001',
    name: 'Set de bloques',
    price: 220,
    category: 'Maderas',
    brandId: 7,
  };

  it('should emit product.created with origin "wappy" when created from the dashboard', async () => {
    const { service, dispatch } = makeService();

    await service.create(dashboardDto as never);

    expect(dispatch.dispatch).toHaveBeenCalledWith(
      7,
      'product.created',
      expect.objectContaining({ origin: 'wappy', name: 'Set de bloques' }),
    );
  });

  it('should NOT emit a webhook when the change came from the external API (anti-loop)', async () => {
    const { service, repo, dispatch } = makeService();
    (repo.findByExternalId as jest.Mock).mockResolvedValue(null);

    await service.upsertFromExternal(7, base);

    expect(dispatch.dispatch).not.toHaveBeenCalled();
  });
});
