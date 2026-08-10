import { Injectable } from '@nestjs/common';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InvitationSchemaClass } from '../entities/invitation.schema';
import { InvitationRepository } from '../../invitation.repository';
import { Invitation } from '../../../../domain/invitation';
import { InvitationMapper } from '../mappers/invitation.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class InvitationDocumentRepository implements InvitationRepository {
  constructor(
    @InjectModel(InvitationSchemaClass.name)
    private readonly invitationModel: Model<InvitationSchemaClass>,
  ) {}

  async create(data: Invitation): Promise<Invitation> {
    const persistenceModel = InvitationMapper.toPersistence(data);
    const createdEntity = new this.invitationModel(persistenceModel);
    const entityObject = await createdEntity.save();
    return InvitationMapper.toDomain(entityObject);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<Invitation[]> {
    const entityObjects = await this.invitationModel
      .find()
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .limit(paginationOptions.limit);

    return entityObjects.map((entityObject) =>
      InvitationMapper.toDomain(entityObject),
    );
  }

  async findById(id: Invitation['id']): Promise<NullableType<Invitation>> {
    const entityObject = await this.invitationModel.findById(id);
    return entityObject ? InvitationMapper.toDomain(entityObject) : null;
  }

  async findByIds(ids: Invitation['id'][]): Promise<Invitation[]> {
    const entityObjects = await this.invitationModel.find({
      _id: { $in: ids },
    });
    return entityObjects.map((entityObject) =>
      InvitationMapper.toDomain(entityObject),
    );
  }

  async findByToken(token: string): Promise<NullableType<Invitation>> {
    const entityObject = await this.invitationModel.findOne({ token });
    return entityObject ? InvitationMapper.toDomain(entityObject) : null;
  }

  async findPendingByBrandId(brandId: number): Promise<Invitation[]> {
    const entityObjects = await this.invitationModel.find({
      brandId,
      status: 'pending',
    });
    return entityObjects.map((entityObject) =>
      InvitationMapper.toDomain(entityObject),
    );
  }

  async update(
    id: Invitation['id'],
    payload: Partial<Invitation>,
  ): Promise<NullableType<Invitation>> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { _id: id.toString() };
    const entity = await this.invitationModel.findOne(filter);

    if (!entity) {
      throw new Error('Record not found');
    }

    const entityObject = await this.invitationModel.findOneAndUpdate(
      filter,
      InvitationMapper.toPersistence({
        ...InvitationMapper.toDomain(entity),
        ...clonedPayload,
      }),
      { new: true },
    );

    return entityObject ? InvitationMapper.toDomain(entityObject) : null;
  }

  async remove(id: Invitation['id']): Promise<void> {
    await this.invitationModel.deleteOne({ _id: id });
  }
}
