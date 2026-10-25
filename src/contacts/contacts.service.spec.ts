import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactRepository } from './infrastructure/persistence/contact.repository';
import { ContactIdentityRepository } from '../contact-identities/infrastructure/persistence/contact-identity.repository';
import { OrdersService } from '../orders/orders.service';

const makeService = () => {
  const contactRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    findByBrandWithPagination: jest.fn(),
    findByBrandEmailOrPhone: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<ContactRepository>;

  const identityRepo = {
    findByChannelConnectionExternal: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findByContactId: jest.fn(),
    findByContactIds: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<ContactIdentityRepository>;

  const orders = {
    ensureForContact: jest.fn().mockResolvedValue({ id: 'o1' }),
    removeForContact: jest.fn().mockResolvedValue(2),
  } as unknown as jest.Mocked<OrdersService>;

  const service = new ContactsService(contactRepo, identityRepo, orders);
  return { service, contactRepo, identityRepo, orders };
};

const identityInput = {
  brandId: 7,
  channel: 'whatsapp',
  connectionId: 3,
  externalId: '16505551234',
  profileName: 'Pablo Morales',
  phone: '16505551234',
};

describe('ContactsService.upsertIdentity', () => {
  it('should create a new contact + identity when none exists', async () => {
    const { service, contactRepo, identityRepo, orders } = makeService();
    identityRepo.findByChannelConnectionExternal.mockResolvedValue(null);
    contactRepo.create.mockResolvedValue({ id: 'c1', brandId: 7 } as never);
    identityRepo.create.mockResolvedValue({
      id: 'i1',
      contactId: 'c1',
    } as never);

    const result = await service.upsertIdentity(identityInput);

    expect(contactRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ brandId: 7, displayName: 'Pablo Morales' }),
    );
    expect(identityRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        contactId: 'c1',
        channel: 'whatsapp',
        connectionId: 3,
        externalId: '16505551234',
      }),
    );
    // New contact → its kanban order is opened (brand-scoped).
    expect(orders.ensureForContact).toHaveBeenCalledWith(7, 'c1');
    expect(result.contact.id).toBe('c1');
    expect(result.identity.contactId).toBe('c1');
  });

  it('should not break ingest when the order hook fails', async () => {
    const { service, contactRepo, identityRepo, orders } = makeService();
    identityRepo.findByChannelConnectionExternal.mockResolvedValue(null);
    contactRepo.create.mockResolvedValue({ id: 'c1', brandId: 7 } as never);
    identityRepo.create.mockResolvedValue({
      id: 'i1',
      contactId: 'c1',
    } as never);
    (orders.ensureForContact as jest.Mock).mockRejectedValue(
      new Error('db down'),
    );

    const result = await service.upsertIdentity(identityInput);

    expect(result.contact.id).toBe('c1'); // ingest still succeeds
  });

  it('should not open an order when the identity already exists', async () => {
    const { service, contactRepo, identityRepo, orders } = makeService();
    identityRepo.findByChannelConnectionExternal.mockResolvedValue({
      id: 'i1',
      contactId: 'c1',
    } as never);
    identityRepo.update.mockResolvedValue({
      id: 'i1',
      contactId: 'c1',
    } as never);
    contactRepo.findById.mockResolvedValue({ id: 'c1', brandId: 7 } as never);

    await service.upsertIdentity(identityInput);

    expect(orders.ensureForContact).not.toHaveBeenCalled();
  });

  it('should update the existing identity and not create a new contact', async () => {
    const { service, contactRepo, identityRepo } = makeService();
    identityRepo.findByChannelConnectionExternal.mockResolvedValue({
      id: 'i1',
      contactId: 'c1',
      handle: null,
      profileName: 'Old Name',
      phone: null,
    } as never);
    identityRepo.update.mockResolvedValue({
      id: 'i1',
      contactId: 'c1',
    } as never);
    contactRepo.findById.mockResolvedValue({ id: 'c1' } as never);

    const result = await service.upsertIdentity(identityInput);

    expect(identityRepo.update).toHaveBeenCalledWith(
      'i1',
      expect.objectContaining({ profileName: 'Pablo Morales' }),
    );
    expect(contactRepo.create).not.toHaveBeenCalled();
    expect(result.contact.id).toBe('c1');
  });
});

describe('ContactsService.create', () => {
  it('should open a kanban order for a manually created contact', async () => {
    const { service, contactRepo, orders } = makeService();
    contactRepo.create.mockResolvedValue({ id: 'c9', brandId: 7 } as never);

    const contact = await service.create({ brandId: 7 } as never);

    expect(orders.ensureForContact).toHaveBeenCalledWith(7, 'c9');
    expect(contact.id).toBe('c9');
  });
});

describe('ContactsService.upsertByEmailOrPhone', () => {
  it('should create a new contact and open its order when no match', async () => {
    const { service, contactRepo, orders } = makeService();
    (contactRepo.findByBrandEmailOrPhone as jest.Mock).mockResolvedValue(null);
    contactRepo.create.mockResolvedValue({ id: 'c1', brandId: 7 } as never);

    const { contact, created } = await service.upsertByEmailOrPhone(7, {
      email: 'a@b.com',
      name: 'Ana',
      tags: ['newsletter'],
    });

    expect(created).toBe(true);
    expect(contactRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        brandId: 7,
        email: 'a@b.com',
        tags: ['newsletter'],
      }),
    );
    expect(orders.ensureForContact).toHaveBeenCalledWith(7, 'c1'); // kanban card
    expect(contact.id).toBe('c1');
  });

  it('should update the existing contact when matched (no new order)', async () => {
    const { service, contactRepo, orders } = makeService();
    (contactRepo.findByBrandEmailOrPhone as jest.Mock).mockResolvedValue({
      id: 'c9',
      brandId: 7,
      displayName: 'Old',
    });
    contactRepo.update.mockResolvedValue({ id: 'c9', brandId: 7 } as never);

    const { created } = await service.upsertByEmailOrPhone(7, {
      email: 'a@b.com',
      name: 'Nuevo',
    });

    expect(created).toBe(false);
    expect(contactRepo.update).toHaveBeenCalledWith(
      'c9',
      expect.objectContaining({ displayName: 'Nuevo' }),
    );
    expect(orders.ensureForContact).not.toHaveBeenCalled();
  });

  it('should reject when neither email nor phone is given', async () => {
    const { service } = makeService();
    await expect(service.upsertByEmailOrPhone(7, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('ContactsService.merge', () => {
  it('should reparent identities and tombstone the loser', async () => {
    const { service, contactRepo, identityRepo } = makeService();
    contactRepo.findById
      .mockResolvedValueOnce({ id: 'survivor' } as never) // survivor
      .mockResolvedValueOnce({ id: 'loser' } as never); // loser
    identityRepo.findByContactId.mockResolvedValue([
      { id: 'i1' },
      { id: 'i2' },
    ] as never);

    const result = await service.merge('survivor', 'loser');

    expect(identityRepo.update).toHaveBeenCalledWith('i1', {
      contactId: 'survivor',
    });
    expect(identityRepo.update).toHaveBeenCalledWith('i2', {
      contactId: 'survivor',
    });
    expect(contactRepo.update).toHaveBeenCalledWith('loser', {
      mergedIntoContactId: 'survivor',
    });
    expect(result.id).toBe('survivor');
  });

  it('should reject merging a contact into itself', async () => {
    const { service } = makeService();
    await expect(service.merge('x', 'x')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('should throw when a contact does not exist', async () => {
    const { service, contactRepo } = makeService();
    contactRepo.findById.mockResolvedValue(null);
    await expect(service.merge('survivor', 'loser')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('ContactsService brand-scoped queries', () => {
  it('should attach each contact its identities in listForBrand', async () => {
    const { service, contactRepo, identityRepo } = makeService();
    contactRepo.findByBrandWithPagination.mockResolvedValue([
      { id: 'c1', brandId: 7 },
      { id: 'c2', brandId: 7 },
    ] as never);
    identityRepo.findByContactIds.mockResolvedValue([
      { id: 'i1', contactId: 'c1', channel: 'whatsapp' },
      { id: 'i2', contactId: 'c1', channel: 'instagram' },
      { id: 'i3', contactId: 'c2', channel: 'whatsapp' },
    ] as never);

    const result = await service.listForBrand(7, { page: 1, limit: 20 });

    expect(result).toHaveLength(2);
    expect(result[0].identities).toHaveLength(2);
    expect(result[1].identities).toHaveLength(1);
  });

  it('should 404 in getForBrand when the contact belongs to another brand', async () => {
    const { service, contactRepo } = makeService();
    contactRepo.findById.mockResolvedValue({ id: 'c1', brandId: 99 } as never);
    await expect(service.getForBrand(7, 'c1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should 404 in mergeForBrand when the loser belongs to another brand', async () => {
    const { service, contactRepo } = makeService();
    contactRepo.findById
      .mockResolvedValueOnce({ id: 'survivor', brandId: 7 } as never)
      .mockResolvedValueOnce({ id: 'loser', brandId: 99 } as never);
    await expect(
      service.mergeForBrand(7, 'survivor', 'loser'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('ContactsService.removeForBrand (S5 cascade)', () => {
  it('should cascade-delete the contact orders then the contact', async () => {
    const { service, contactRepo, identityRepo, orders } = makeService();
    contactRepo.findById.mockResolvedValue({ id: 'c1', brandId: 7 } as never);
    identityRepo.findByContactId.mockResolvedValue([] as never);

    await service.removeForBrand(7, 'c1');

    expect(orders.removeForContact).toHaveBeenCalledWith(7, 'c1');
    expect(contactRepo.remove).toHaveBeenCalledWith('c1');
  });

  it('should 404 and not cascade when the contact belongs to another brand', async () => {
    const { service, contactRepo, orders } = makeService();
    contactRepo.findById.mockResolvedValue({ id: 'c1', brandId: 99 } as never);

    await expect(service.removeForBrand(7, 'c1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(orders.removeForContact).not.toHaveBeenCalled();
    expect(contactRepo.remove).not.toHaveBeenCalled();
  });
});
