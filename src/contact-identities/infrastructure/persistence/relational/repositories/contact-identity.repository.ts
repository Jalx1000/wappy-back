import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { ContactIdentityEntity } from '../entities/contact-identity.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { ContactIdentity } from '../../../../domain/contact-identity';
import { ContactIdentityRepository } from '../../contact-identity.repository';
import { ContactIdentityMapper } from '../mappers/contact-identity.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class ContactIdentityRelationalRepository implements ContactIdentityRepository {
  constructor(
    @InjectRepository(ContactIdentityEntity)
    private readonly contactIdentityRepository: Repository<ContactIdentityEntity>,
  ) {}

  async create(data: ContactIdentity): Promise<ContactIdentity> {
    const persistenceModel = ContactIdentityMapper.toPersistence(data);
    const newEntity = await this.contactIdentityRepository.save(
      this.contactIdentityRepository.create(persistenceModel),
    );
    return ContactIdentityMapper.toDomain(newEntity);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<ContactIdentity[]> {
    const entities = await this.contactIdentityRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });

    return entities.map((entity) => ContactIdentityMapper.toDomain(entity));
  }

  async findById(
    id: ContactIdentity['id'],
  ): Promise<NullableType<ContactIdentity>> {
    const entity = await this.contactIdentityRepository.findOne({
      where: { id },
    });

    return entity ? ContactIdentityMapper.toDomain(entity) : null;
  }

  async findByIds(ids: ContactIdentity['id'][]): Promise<ContactIdentity[]> {
    const entities = await this.contactIdentityRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => ContactIdentityMapper.toDomain(entity));
  }

  async findByChannelConnectionExternal(
    channel: string,
    connectionId: number | null,
    externalId: string,
  ): Promise<NullableType<ContactIdentity>> {
    const entity = await this.contactIdentityRepository.findOne({
      where: {
        channel,
        connectionId: connectionId === null ? IsNull() : connectionId,
        externalId,
      },
    });

    return entity ? ContactIdentityMapper.toDomain(entity) : null;
  }

  async findByContactId(
    contactId: ContactIdentity['contactId'],
  ): Promise<ContactIdentity[]> {
    const entities = await this.contactIdentityRepository.find({
      where: { contactId },
    });

    return entities.map((entity) => ContactIdentityMapper.toDomain(entity));
  }

  async findByContactIds(
    contactIds: ContactIdentity['contactId'][],
  ): Promise<ContactIdentity[]> {
    if (contactIds.length === 0) return [];
    const entities = await this.contactIdentityRepository.find({
      where: { contactId: In(contactIds) },
    });

    return entities.map((entity) => ContactIdentityMapper.toDomain(entity));
  }

  async update(
    id: ContactIdentity['id'],
    payload: Partial<ContactIdentity>,
  ): Promise<ContactIdentity> {
    const entity = await this.contactIdentityRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Record not found');
    }

    const updatedEntity = await this.contactIdentityRepository.save(
      this.contactIdentityRepository.create(
        ContactIdentityMapper.toPersistence({
          ...ContactIdentityMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return ContactIdentityMapper.toDomain(updatedEntity);
  }

  async remove(id: ContactIdentity['id']): Promise<void> {
    await this.contactIdentityRepository.delete(id);
  }
}
