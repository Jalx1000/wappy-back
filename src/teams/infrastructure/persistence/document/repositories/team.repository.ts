import { Injectable } from '@nestjs/common';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TeamSchemaClass } from '../entities/team.schema';
import { TeamRepository } from '../../team.repository';
import { Team } from '../../../../domain/team';
import { TeamMapper } from '../mappers/team.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class TeamDocumentRepository implements TeamRepository {
  constructor(
    @InjectModel(TeamSchemaClass.name)
    private readonly teamModel: Model<TeamSchemaClass>,
  ) {}

  async create(data: Team): Promise<Team> {
    const persistenceModel = TeamMapper.toPersistence(data);
    const createdEntity = new this.teamModel(persistenceModel);
    const entityObject = await createdEntity.save();
    return TeamMapper.toDomain(entityObject);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<Team[]> {
    const entityObjects = await this.teamModel
      .find()
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .limit(paginationOptions.limit);

    return entityObjects.map((entityObject) =>
      TeamMapper.toDomain(entityObject),
    );
  }

  async findById(id: Team['id']): Promise<NullableType<Team>> {
    const entityObject = await this.teamModel.findById(id);
    return entityObject ? TeamMapper.toDomain(entityObject) : null;
  }

  async findByIds(ids: Team['id'][]): Promise<Team[]> {
    const entityObjects = await this.teamModel.find({ _id: { $in: ids } });
    return entityObjects.map((entityObject) =>
      TeamMapper.toDomain(entityObject),
    );
  }

  // Teams run on the relational driver; these are not implemented for document.
  findByBrandId(): Promise<Team[]> {
    throw new Error('Teams are not supported on the document driver');
  }

  addMember(): Promise<void> {
    throw new Error('Teams are not supported on the document driver');
  }

  removeMember(): Promise<void> {
    throw new Error('Teams are not supported on the document driver');
  }

  async update(
    id: Team['id'],
    payload: Partial<Team>,
  ): Promise<NullableType<Team>> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { _id: id.toString() };
    const entity = await this.teamModel.findOne(filter);

    if (!entity) {
      throw new Error('Record not found');
    }

    const entityObject = await this.teamModel.findOneAndUpdate(
      filter,
      TeamMapper.toPersistence({
        ...TeamMapper.toDomain(entity),
        ...clonedPayload,
      }),
      { new: true },
    );

    return entityObject ? TeamMapper.toDomain(entityObject) : null;
  }

  async remove(id: Team['id']): Promise<void> {
    await this.teamModel.deleteOne({ _id: id });
  }
}
