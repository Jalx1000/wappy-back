import { GetOrderTool } from './get-order.tool';
import { OrdersService } from '../../orders/orders.service';

const makeTool = () => {
  const orders = {
    getForContact: jest.fn(),
  } as unknown as jest.Mocked<OrdersService>;
  return { tool: new GetOrderTool(orders), orders };
};

describe('GetOrderTool', () => {
  it('should return the order of the conversation contact (brand-scoped)', async () => {
    const { tool, orders } = makeTool();
    (orders.getForContact as jest.Mock).mockResolvedValue({
      status: 'confirmado',
      total: 120,
      currency: 'USD',
      notes: 'entregar viernes',
    });

    const res = (await tool.run({}, { brandId: 7, contactId: 'c1' })) as {
      found: boolean;
      order: { status: string; total: number };
    };

    expect(orders.getForContact).toHaveBeenCalledWith(7, 'c1');
    expect(res.found).toBe(true);
    expect(res.order.status).toBe('confirmado');
    expect(res.order.total).toBe(120);
  });

  it('should report not found when the conversation has no contact', async () => {
    const { tool, orders } = makeTool();
    const res = (await tool.run({}, { brandId: 7 })) as { found: boolean };
    expect(res.found).toBe(false);
    expect(orders.getForContact).not.toHaveBeenCalled();
  });

  it('should report not found when the customer has no order', async () => {
    const { tool, orders } = makeTool();
    (orders.getForContact as jest.Mock).mockResolvedValue(null);
    const res = (await tool.run({}, { brandId: 7, contactId: 'c1' })) as {
      found: boolean;
    };
    expect(res.found).toBe(false);
  });
});
