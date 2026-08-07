import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { ContactIdentity } from '../../domain/contact-identity';

export abstract class ContactIdentityRepository {
  abstract create(
    data: Omit<ContactIdentity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ContactIdentity>;

  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<ContactIdentity[]>;

  abstract findById(
    id: ContactIdentity['id'],
  ): Promise<NullableType<ContactIdentity>>;

  abstract findByIds(ids: ContactIdentity['id'][]): Promise<ContactIdentity[]>;

  // Upsert key: locates an existing identity for a given channel presence.
  abstract findByChannelConnectionExternal(
    channel: string,
    connectionId: number | null,
    externalId: string,
  ): Promise<NullableType<ContactIdentity>>;

  // All identities pointing at a contact — used when merging contacts.
  abstract findByContactId(
    contactId: ContactIdentity['contactId'],
  ): Promise<ContactIdentity[]>;

  // All identities of many contacts at once — used to hydrate contact lists.
  abstract findByContactIds(
    contactIds: ContactIdentity['contactId'][],
  ): Promise<ContactIdentity[]>;

  abstract update(
    id: ContactIdentity['id'],
    payload: DeepPartial<ContactIdentity>,
  ): Promise<ContactIdentity | null>;

  abstract remove(id: ContactIdentity['id']): Promise<void>;
}
