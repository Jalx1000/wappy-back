import {
  // common
  Injectable,
} from '@nestjs/common';
import { CreateContactIdentityDto } from './dto/create-contact-identity.dto';
import { UpdateContactIdentityDto } from './dto/update-contact-identity.dto';
import { ContactIdentityRepository } from './infrastructure/persistence/contact-identity.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { ContactIdentity } from './domain/contact-identity';

@Injectable()
export class ContactIdentitiesService {
  constructor(
    // Dependencies here
    private readonly contactIdentityRepository: ContactIdentityRepository,
  ) {}

  async create(createContactIdentityDto: CreateContactIdentityDto) {
    // Do not remove comment below.
    // <creating-property />

    return this.contactIdentityRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
      phone: createContactIdentityDto.phone,

      profileName: createContactIdentityDto.profileName,

      handle: createContactIdentityDto.handle,

      externalId: createContactIdentityDto.externalId,

      connectionId: createContactIdentityDto.connectionId,

      channel: createContactIdentityDto.channel,

      contactId: createContactIdentityDto.contactId,
    });
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.contactIdentityRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: ContactIdentity['id']) {
    return this.contactIdentityRepository.findById(id);
  }

  findByIds(ids: ContactIdentity['id'][]) {
    return this.contactIdentityRepository.findByIds(ids);
  }

  async update(
    id: ContactIdentity['id'],

    updateContactIdentityDto: UpdateContactIdentityDto,
  ) {
    // Do not remove comment below.
    // <updating-property />

    return this.contactIdentityRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      phone: updateContactIdentityDto.phone,

      profileName: updateContactIdentityDto.profileName,

      handle: updateContactIdentityDto.handle,

      externalId: updateContactIdentityDto.externalId,

      connectionId: updateContactIdentityDto.connectionId,

      channel: updateContactIdentityDto.channel,

      contactId: updateContactIdentityDto.contactId,
    });
  }

  remove(id: ContactIdentity['id']) {
    return this.contactIdentityRepository.remove(id);
  }
}
