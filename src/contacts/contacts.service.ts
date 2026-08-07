import {
  // common
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactRepository } from './infrastructure/persistence/contact.repository';
import { ContactIdentityRepository } from '../contact-identities/infrastructure/persistence/contact-identity.repository';
import { ContactIdentity } from '../contact-identities/domain/contact-identity';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Contact } from './domain/contact';

// Single entry point every channel (WhatsApp, TikTok, LinkedIn, Messenger,
// Instagram, …) uses to attach one of its users to a central Contact.
export interface UpsertIdentityInput {
  brandId: number;
  channel: string;
  externalId: string;
  connectionId?: number | null;
  handle?: string | null;
  profileName?: string | null;
  phone?: string | null;
}

// A contact plus every channel identity attached to it — the shape the UI needs
// to show "who this person is across WhatsApp / Instagram / …".
export interface ContactWithIdentities {
  contact: Contact;
  identities: ContactIdentity[];
}

// Fields a user may edit from the Contacts UI (brand and merge state are not
// user-editable).
export interface UpdateContactProfile {
  displayName?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  avatarUrl?: string | null;
}

@Injectable()
export class ContactsService {
  constructor(
    // Dependencies here
    private readonly contactRepository: ContactRepository,
    private readonly identityRepository: ContactIdentityRepository,
  ) {}

  /**
   * Idempotent upsert of a channel identity into the central contact model.
   * If the identity (channel + connection + externalId) already exists, its
   * mutable fields are refreshed. Otherwise a brand-new Contact is created with
   * a single identity — the manual-merge policy: identities are never
   * auto-merged; a human merges duplicates later via merge().
   *
   * The UQ_contact_identity_channel_conn_external unique index is the backstop
   * against races creating duplicate identities.
   */
  async upsertIdentity(
    input: UpsertIdentityInput,
  ): Promise<{ contact: Contact; identity: ContactIdentity }> {
    const existing =
      await this.identityRepository.findByChannelConnectionExternal(
        input.channel,
        input.connectionId ?? null,
        input.externalId,
      );

    if (existing) {
      const identity = await this.identityRepository.update(existing.id, {
        handle: input.handle ?? existing.handle,
        profileName: input.profileName ?? existing.profileName,
        phone: input.phone ?? existing.phone,
      });
      const contact = await this.contactRepository.findById(existing.contactId);
      if (!contact) {
        throw new NotFoundException(
          `Contact ${existing.contactId} referenced by identity ${existing.id} not found`,
        );
      }
      return { contact, identity: identity ?? existing };
    }

    const contact = await this.contactRepository.create({
      brandId: input.brandId,
      displayName: input.profileName ?? null,
      phone: input.phone ?? null,
      email: null,
      avatarUrl: null,
      notes: null,
      mergedIntoContactId: null,
    });

    const identity = await this.identityRepository.create({
      contactId: contact.id,
      channel: input.channel,
      connectionId: input.connectionId ?? null,
      externalId: input.externalId,
      handle: input.handle ?? null,
      profileName: input.profileName ?? null,
      phone: input.phone ?? null,
    });

    return { contact, identity };
  }

  /**
   * Manual merge: reparents every identity of `loserId` onto `survivorId` and
   * tombstones the loser (mergedIntoContactId → survivor). Active-contact
   * queries should filter `mergedIntoContactId IS NULL`.
   */
  async merge(survivorId: string, loserId: string): Promise<Contact> {
    if (survivorId === loserId) {
      throw new BadRequestException('Cannot merge a contact into itself');
    }
    const survivor = await this.contactRepository.findById(survivorId);
    const loser = await this.contactRepository.findById(loserId);
    if (!survivor) {
      throw new NotFoundException(`Survivor contact ${survivorId} not found`);
    }
    if (!loser) {
      throw new NotFoundException(`Loser contact ${loserId} not found`);
    }

    const identities = await this.identityRepository.findByContactId(loserId);
    for (const identity of identities) {
      await this.identityRepository.update(identity.id, {
        contactId: survivorId,
      });
    }

    await this.contactRepository.update(loserId, {
      mergedIntoContactId: survivorId,
    });

    return survivor;
  }

  // ── Brand-scoped read/write for the Contacts UI ──────────────────────────

  /** Active contacts of a brand (paginated, searchable) with their identities. */
  async listForBrand(
    brandId: number,
    opts: { page: number; limit: number; search?: string },
  ): Promise<ContactWithIdentities[]> {
    const contacts = await this.contactRepository.findByBrandWithPagination({
      brandId,
      paginationOptions: { page: opts.page, limit: opts.limit },
      search: opts.search,
    });
    if (contacts.length === 0) return [];

    const identities = await this.identityRepository.findByContactIds(
      contacts.map((c) => c.id),
    );
    const byContact = new Map<string, ContactIdentity[]>();
    for (const identity of identities) {
      const list = byContact.get(identity.contactId) ?? [];
      list.push(identity);
      byContact.set(identity.contactId, list);
    }

    return contacts.map((contact) => ({
      contact,
      identities: byContact.get(contact.id) ?? [],
    }));
  }

  /** A single brand-owned contact with its identities (404 if not the brand's). */
  async getForBrand(
    brandId: number,
    id: string,
  ): Promise<ContactWithIdentities> {
    const contact = await this.contactRepository.findById(id);
    if (!contact || contact.brandId !== brandId) {
      throw new NotFoundException('Contact not found');
    }
    const identities = await this.identityRepository.findByContactId(id);
    return { contact, identities };
  }

  /** Edits the user-facing fields of a brand-owned contact. */
  async updateProfileForBrand(
    brandId: number,
    id: string,
    patch: UpdateContactProfile,
  ): Promise<ContactWithIdentities> {
    const contact = await this.contactRepository.findById(id);
    if (!contact || contact.brandId !== brandId) {
      throw new NotFoundException('Contact not found');
    }
    await this.contactRepository.update(id, {
      displayName: patch.displayName,
      phone: patch.phone,
      email: patch.email,
      notes: patch.notes,
      avatarUrl: patch.avatarUrl,
    });
    return this.getForBrand(brandId, id);
  }

  /** Merges `loserId` into `survivorId`; both must belong to the brand. */
  async mergeForBrand(
    brandId: number,
    survivorId: string,
    loserId: string,
  ): Promise<ContactWithIdentities> {
    const [survivor, loser] = await Promise.all([
      this.contactRepository.findById(survivorId),
      this.contactRepository.findById(loserId),
    ]);
    if (!survivor || survivor.brandId !== brandId) {
      throw new NotFoundException('Contact not found');
    }
    if (!loser || loser.brandId !== brandId) {
      throw new NotFoundException('Contact not found');
    }
    await this.merge(survivorId, loserId);
    return this.getForBrand(brandId, survivorId);
  }

  async create(createContactDto: CreateContactDto) {
    // Do not remove comment below.
    // <creating-property />

    return this.contactRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
      mergedIntoContactId: createContactDto.mergedIntoContactId,

      notes: createContactDto.notes,

      avatarUrl: createContactDto.avatarUrl,

      email: createContactDto.email,

      phone: createContactDto.phone,

      displayName: createContactDto.displayName,

      brandId: createContactDto.brandId,
    });
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.contactRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: Contact['id']) {
    return this.contactRepository.findById(id);
  }

  findByIds(ids: Contact['id'][]) {
    return this.contactRepository.findByIds(ids);
  }

  async update(
    id: Contact['id'],

    updateContactDto: UpdateContactDto,
  ) {
    // Do not remove comment below.
    // <updating-property />

    return this.contactRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      mergedIntoContactId: updateContactDto.mergedIntoContactId,

      notes: updateContactDto.notes,

      avatarUrl: updateContactDto.avatarUrl,

      email: updateContactDto.email,

      phone: updateContactDto.phone,

      displayName: updateContactDto.displayName,

      brandId: updateContactDto.brandId,
    });
  }

  remove(id: Contact['id']) {
    return this.contactRepository.remove(id);
  }
}
