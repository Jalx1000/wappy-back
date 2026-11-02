import { IntegrationProductsController } from './integration-products.controller';
import { ProductsService } from '../../products/products.service';

const makeController = () => {
  const products = {
    upsertFromExternal: jest.fn(() =>
      Promise.resolve({
        product: { id: 'p1', externalId: 'wc_128' },
        created: true,
      }),
    ),
  } as unknown as jest.Mocked<ProductsService>;
  const controller = new IntegrationProductsController(products);
  return { controller, products };
};

const req = { brand: { id: 7 } } as { brand: { id: number } };

const dto = {
  external_id: 'wc_128',
  sku: 'YIYI-ABC-123',
  name: 'ABC Magnéticos',
  price: 180,
  category: 'Didácticos y educativos',
  attributes: [
    { key: 'material', label: 'Material', type: 'text', value: 'Madera' },
  ],
  origin: 'woocommerce',
};

describe('IntegrationProductsController (S2/S3)', () => {
  it('should map the public payload and upsert by external_id', async () => {
    const { controller, products } = makeController();

    const res = await controller.upsert(req as never, dto as never);

    expect(products.upsertFromExternal).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        externalId: 'wc_128',
        sku: 'YIYI-ABC-123',
        name: 'ABC Magnéticos',
        price: 180,
        category: 'Didácticos y educativos',
        attributes: dto.attributes,
      }),
    );
    expect(res).toEqual({ id: 'p1', external_id: 'wc_128', created: true });
  });

  it('should soft-delete by external_id from the path param', async () => {
    const products = {
      deactivateByExternalId: jest.fn(() =>
        Promise.resolve({ id: 'p1', deactivated: true }),
      ),
    } as unknown as jest.Mocked<ProductsService>;
    const controller = new IntegrationProductsController(products);

    const res = await controller.deactivate(req as never, 'wc_128');

    expect(products.deactivateByExternalId).toHaveBeenCalledWith(7, 'wc_128');
    expect(res).toEqual({ id: 'p1', external_id: 'wc_128', deactivated: true });
  });
});
