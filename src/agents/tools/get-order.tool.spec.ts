import { GetOrderTool } from './get-order.tool';
import { OrdersService } from '../../orders/orders.service';

const makeTool = () => {
  const orders = {
    getLatestForContact: jest.fn(),
  } as unknown as jest.Mocked<OrdersService>;
  return { tool: new GetOrderTool(orders), orders };
};

describe('GetOrderTool', () => {
  it('should return the latest order of the conversation contact with its line items', async () => {
    const { tool, orders } = makeTool();
    (orders.getLatestForContact as jest.Mock).mockResolvedValue({
      status: 'confirmado',
      total: 120,
      currency: 'BOB',
      notes: 'entregar viernes',
      items: [
        {
          productName: 'Peluche oso',
          sku: 'PEL-001',
          quantity: 1,
          unitPrice: 120,
          lineTotal: 120,
        },
      ],
    });

    const res = (await tool.run({}, { brandId: 7, contactId: 'c1' })) as {
      found: boolean;
      order: { status: string; total: number; items: unknown[] };
    };

    expect(orders.getLatestForContact).toHaveBeenCalledWith(7, 'c1');
    expect(res.found).toBe(true);
    expect(res.order.status).toBe('confirmado');
    expect(res.order.total).toBe(120);
    expect(res.order.items).toHaveLength(1);
  });

  it('should report not found when the conversation has no contact', async () => {
    const { tool, orders } = makeTool();
    const res = (await tool.run({}, { brandId: 7 })) as { found: boolean };
    expect(res.found).toBe(false);
    expect(orders.getLatestForContact).not.toHaveBeenCalled();
  });

  it('should report not found when the customer has no order', async () => {
    const { tool, orders } = makeTool();
    (orders.getLatestForContact as jest.Mock).mockResolvedValue(null);
    const res = (await tool.run({}, { brandId: 7, contactId: 'c1' })) as {
      found: boolean;
    };
    expect(res.found).toBe(false);
  });
});
