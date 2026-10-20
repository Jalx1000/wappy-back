import { GetCustomerTool } from './get-customer.tool';
import { ContactsService } from '../../contacts/contacts.service';

const CW = {
  contact: {
    id: 'c1',
    displayName: 'María Rojas',
    email: 'maria@example.com',
    phone: '+59170011223',
    notes: 'VIP',
    brandId: 7,
  },
  identities: [
    {
      channel: 'whatsapp',
      handle: null,
      profileName: 'María',
      externalId: '59170011223',
    },
  ],
};

const makeTool = () => {
  const service = {
    getForBrand: jest.fn(),
    listForBrand: jest.fn(),
  } as unknown as jest.Mocked<ContactsService>;
  return { tool: new GetCustomerTool(service), service };
};

describe('GetCustomerTool', () => {
  it('should return the conversation contact when no search (brand-scoped)', async () => {
    const { tool, service } = makeTool();
    (service.getForBrand as jest.Mock).mockResolvedValue(CW);

    const res = (await tool.run({}, { brandId: 7, contactId: 'c1' })) as {
      found: boolean;
      customer: { name: string; phone: string };
    };

    expect(service.getForBrand).toHaveBeenCalledWith(7, 'c1');
    expect(res.found).toBe(true);
    expect(res.customer.name).toBe('María Rojas');
    expect(res.customer.phone).toBe('+59170011223');
  });

  it('should report not found when the conversation has no contact', async () => {
    const { tool, service } = makeTool();
    const res = (await tool.run({}, { brandId: 7 })) as { found: boolean };
    expect(res.found).toBe(false);
    expect(service.getForBrand).not.toHaveBeenCalled();
  });

  it('should search by text scoped to the brand', async () => {
    const { tool, service } = makeTool();
    (service.listForBrand as jest.Mock).mockResolvedValue([CW]);

    const res = (await tool.run({ search: 'maria' }, { brandId: 7 })) as {
      found: boolean;
      count: number;
    };

    expect(service.listForBrand).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ search: 'maria' }),
    );
    expect(res.found).toBe(true);
    expect(res.count).toBe(1);
  });
});
