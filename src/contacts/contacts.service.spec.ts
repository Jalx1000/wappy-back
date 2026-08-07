import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactRepository } from './infrastructure/persistence/contact.repository';
import { ContactIdentityRepository } from '../contact-identities/infrastructure/persistence/contact-identity.repository';

const makeService = () => {
  const contactRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    findByBrandWithPagination: jest.fn(),
  } as unknown as jest.Mocked<ContactRepository>;

  const identityRepo = {
    findByChannelConnectionExternal: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findByContactId: jest.fn(),
    findByContactIds: jest.fn(),
  } as unknown as jest.Mocked<ContactIdentityRepository>;

  const service = new ContactsService(contactRepo, identityRepo);
  return { service, contactRepo, identityRepo };
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
    const { service, contactRepo, identityRepo } = makeService();
    identityRepo.findByChannelConnectionExternal.mockResolvedValue(null);
    contactRepo.create.mockResolvedValue({ id: 'c1' } as never);
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
    expect(result.contact.id).toBe('c1');
    expect(result.identity.contactId).toBe('c1');
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
