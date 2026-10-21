import { NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderRepository } from './infrastructure/persistence/order.repository';

const makeService = () => {
  const repo = {
    create: jest.fn((d) => Promise.resolve({ id: 'o1', ...d })),
    findById: jest.fn(),
    findByBrand: jest.fn(),
    findByContact: jest.fn(),
    update: jest.fn((id, p) => Promise.resolve({ id, ...p })),
  } as unknown as jest.Mocked<OrderRepository>;
  return { service: new OrdersService(repo), repo };
};

describe('OrdersService.ensureForContact', () => {
  it('should create the order in the first stage when none exists', async () => {
    const { service, repo } = makeService();
    (repo.findByContact as jest.Mock).mockResolvedValue(null);

    const order = await service.ensureForContact(7, 'c1');

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        brandId: 7,
        contactId: 'c1',
        status: 'no_atendido',
        total: 0,
      }),
    );
    expect(order.status).toBe('no_atendido');
  });

  it('should be idempotent: return the existing order, not create another', async () => {
    const { service, repo } = makeService();
    (repo.findByContact as jest.Mock).mockResolvedValue({
      id: 'o9',
      contactId: 'c1',
      status: 'confirmado',
    });

    const order = await service.ensureForContact(7, 'c1');

    expect(repo.create).not.toHaveBeenCalled();
    expect(order.id).toBe('o9');
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

  it('should return null from getForContact for another brand', async () => {
    const { service, repo } = makeService();
    (repo.findByContact as jest.Mock).mockResolvedValue({
      id: 'o1',
      brandId: 999,
      contactId: 'c1',
    });
    expect(await service.getForContact(7, 'c1')).toBeNull();
  });
});
