import { GetProductsTool } from './get-products.tool';
import { ProductsService } from '../../products/products.service';

const makeTool = (products: unknown[]) => {
  const service = {
    findAllWithPagination: jest.fn().mockResolvedValue(products),
  } as unknown as jest.Mocked<ProductsService>;
  return { tool: new GetProductsTool(service), service };
};

const P = (over: Record<string, unknown>) => ({
  id: 'p',
  sku: 'SKU',
  name: 'Item',
  description: null,
  price: 10,
  stock: 5,
  category: 'cat',
  isActive: true,
  brandId: 7,
  ...over,
});

describe('GetProductsTool', () => {
  it('should scope to ctx.brandId (never from args)', async () => {
    const { tool, service } = makeTool([]);
    await tool.run({ brandId: 999 }, { brandId: 7 });
    expect(service.findAllWithPagination).toHaveBeenCalledWith(
      expect.objectContaining({ brandId: 7 }),
    );
  });

  it('should return only published (isActive) products, trimmed', async () => {
    const { tool } = makeTool([
      P({ sku: 'A', name: 'Azul', isActive: true }),
      P({ sku: 'B', name: 'Oculto', isActive: false }),
    ]);
    const res = (await tool.run({}, { brandId: 7 })) as {
      count: number;
      products: { sku: string }[];
    };
    expect(res.count).toBe(1);
    expect(res.products[0].sku).toBe('A');
    expect(res.products[0]).not.toHaveProperty('brandId');
    expect(res.products[0]).not.toHaveProperty('isActive');
  });

  it('should filter by search across name/sku/category', async () => {
    const { tool } = makeTool([
      P({ sku: 'A', name: 'Camisa azul' }),
      P({ sku: 'B', name: 'Pantalón negro' }),
    ]);
    const res = (await tool.run({ search: 'azul' }, { brandId: 7 })) as {
      count: number;
      products: { name: string }[];
    };
    expect(res.count).toBe(1);
    expect(res.products[0].name).toBe('Camisa azul');
  });
});
