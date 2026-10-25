import { BadRequestException } from '@nestjs/common';
import { IntegrationOrdersController } from './integration-orders.controller';
import { ContactsService } from '../../contacts/contacts.service';
import { OrdersService } from '../../orders/orders.service';

const makeController = () => {
  const contacts = {
    upsertByEmailOrPhone: jest.fn(() =>
      Promise.resolve({ contact: { id: 'c1' }, created: true }),
    ),
  } as unknown as jest.Mocked<ContactsService>;
  const orders = {
    createFromExternal: jest.fn(() =>
      Promise.resolve({ id: 'o1', total: 350 }),
    ),
  } as unknown as jest.Mocked<OrdersService>;
  const controller = new IntegrationOrdersController(contacts, orders);
  return { controller, contacts, orders };
};

const req = { brand: { id: 7 } } as { brand: { id: number } };

const dto = {
  contact: { email: 'cliente@correo.com', phone: '+59170000000', name: 'Ana' },
  external_id: 'wc_1023',
  order_number: '#1023',
  currency: 'BOB',
  total: 350,
  items: [
    {
      product_name: 'Peluche oso',
      sku: 'PEL-001',
      quantity: 2,
      unit_price: 100,
      line_total: 200,
    },
  ],
};

describe('IntegrationOrdersController (S2)', () => {
  it('should upsert the contact from checkout and create the order with its line items', async () => {
    const { controller, contacts, orders } = makeController();

    const res = await controller.create(req as never, dto as never);

    expect(contacts.upsertByEmailOrPhone).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        email: 'cliente@correo.com',
        phone: '+59170000000',
        name: 'Ana',
      }),
    );
    expect(orders.createFromExternal).toHaveBeenCalledWith(
      7,
      'c1',
      expect.objectContaining({
        externalId: 'wc_1023',
        orderNumber: '#1023',
        currency: 'BOB',
        total: 350,
        items: [
          {
            productName: 'Peluche oso',
            sku: 'PEL-001',
            quantity: 2,
            unitPrice: 100,
            lineTotal: 200,
          },
        ],
      }),
    );
    expect(res).toEqual({ id: 'o1', contact_id: 'c1', created: true });
  });

  it('should 400 when the order carries neither email nor phone', async () => {
    const { controller, contacts, orders } = makeController();

    await expect(
      controller.create(
        req as never,
        {
          ...dto,
          contact: { name: 'Ana' },
        } as never,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(contacts.upsertByEmailOrPhone).not.toHaveBeenCalled();
    expect(orders.createFromExternal).not.toHaveBeenCalled();
  });
});
