import { NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderRepository } from './infrastructure/persistence/order.repository';

const makeService = () => {
  const repo = {
    create: jest.fn((d) => Promise.resolve({ id: 'o1', ...d })),
    findById: jest.fn(),
    findByBrand: jest.fn(),
    findByContact: jest.fn(),
    findLeadByContact: jest.fn(),
    findManyByContact: jest.fn(),
    findByExternalId: jest.fn(),
    countByContact: jest.fn(),
    update: jest.fn((id, p) => Promise.resolve({ id, ...p })),
    remove: jest.fn(() => Promise.resolve()),
  } as unknown as jest.Mocked<OrderRepository>;
  return { service: new OrdersService(repo), repo };
};

const items = [
  {
    productName: 'Peluche oso',
    sku: 'PEL-001',
    quantity: 2,
    unitPrice: 100,
    lineTotal: 200,
  },
  {
    productName: 'Set de bloques',
    sku: 'BLK-010',
    quantity: 1,
    unitPrice: 150,
    lineTotal: 150,
  },
];

describe('OrdersService.ensureForContact (lead, S1)', () => {
  it('should create the lead order in the first stage with source=lead when none exists', async () => {
    const { service, repo } = makeService();
    (repo.findLeadByContact as jest.Mock).mockResolvedValue(null);

    const order = await service.ensureForContact(7, 'c1');

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        brandId: 7,
        contactId: 'c1',
        status: 'no_atendido',
        source: 'lead',
        total: 0,
      }),
    );
    expect(order.status).toBe('no_atendido');
  });

  it('should be idempotent on the lead: return the existing lead, not create another', async () => {
    const { service, repo } = makeService();
    (repo.findLeadByContact as jest.Mock).mockResolvedValue({
      id: 'o9',
      contactId: 'c1',
      source: 'lead',
      status: 'contactado',
    });

    const order = await service.ensureForContact(7, 'c1');

    expect(repo.create).not.toHaveBeenCalled();
    expect(order.id).toBe('o9');
  });
});

describe('OrdersService.createFromExternal (WooCommerce, S2)', () => {
  it('should create a woocommerce order with line items and real total', async () => {
    const { service, repo } = makeService();
    (repo.findByExternalId as jest.Mock).mockResolvedValue(null);

    const order = await service.createFromExternal(7, 'c1', {
      externalId: 'wc_1023',
      orderNumber: '#1023',
      currency: 'BOB',
      total: 350,
      items,
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        brandId: 7,
        contactId: 'c1',
        source: 'woocommerce',
        externalId: 'wc_1023',
        orderNumber: '#1023',
        currency: 'BOB',
        total: 350,
        items,
      }),
    );
    expect(order.total).toBe(350);
  });

  it('should be idempotent by externalId: return the existing order, not create a duplicate', async () => {
    const { service, repo } = makeService();
    (repo.findByExternalId as jest.Mock).mockResolvedValue({
      id: 'oEXISTING',
      brandId: 7,
      externalId: 'wc_1023',
    });

    const order = await service.createFromExternal(7, 'c1', {
      externalId: 'wc_1023',
      orderNumber: '#1023',
      currency: 'BOB',
      total: 350,
      items,
    });

    expect(repo.create).not.toHaveBeenCalled();
    expect(order.id).toBe('oEXISTING');
  });
});

describe('OrdersService N-orders-per-contact (S4)', () => {
  it('should return all brand-owned orders of a contact via findManyForContact', async () => {
    const { service, repo } = makeService();
    (repo.findManyByContact as jest.Mock).mockResolvedValue([
      { id: 'o1', brandId: 7, contactId: 'c1', source: 'lead' },
      { id: 'o2', brandId: 7, contactId: 'c1', source: 'woocommerce' },
    ]);

    const orders = await service.findManyForContact(7, 'c1');

    expect(orders).toHaveLength(2);
    expect(orders.map((o) => o.id)).toEqual(['o1', 'o2']);
  });

  it('should delete a single owned order via removeForBrand', async () => {
    const { service, repo } = makeService();
    (repo.findById as jest.Mock).mockResolvedValue({ id: 'o1', brandId: 7 });

    await service.removeForBrand(7, 'o1');

    expect(repo.remove).toHaveBeenCalledWith('o1');
  });

  it('should 404 on removeForBrand for another brand order (no delete)', async () => {
    const { service, repo } = makeService();
    (repo.findById as jest.Mock).mockResolvedValue({ id: 'o1', brandId: 999 });

    await expect(service.removeForBrand(7, 'o1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repo.remove).not.toHaveBeenCalled();
  });

  it('should count how many orders a contact has for the S5 warning', async () => {
    const { service, repo } = makeService();
    (repo.countByContact as jest.Mock).mockResolvedValue(3);

    expect(await service.countForContact('c1')).toBe(3);
  });
});

describe('OrdersService brand-scoping', () => {
  it('should 404 on getForBrand for another brand order', async () => {
    const { service, repo } = makeService();
    (repo.findById as jest.Mock).mockResolvedValue({ id: 'o1', brandId: 999 });
    await expect(service.getForBrand(7, 'o1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should move the stage of an owned order via updateForBrand', async () => {
    const { service, repo } = makeService();
    (repo.findById as jest.Mock).mockResolvedValue({ id: 'o1', brandId: 7 });

    const updated = await service.updateForBrand(7, 'o1', {
      status: 'contactado',
    });

    expect(repo.update).toHaveBeenCalledWith(
      'o1',
      expect.objectContaining({ status: 'contactado' }),
    );
    expect(updated.status).toBe('contactado');
  });
});
