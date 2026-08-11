import { Injectable } from '@nestjs/common';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CompanySchemaClass } from '../entities/company.schema';
import { CompanyRepository } from '../../company.repository';
import { Company } from '../../../../domain/company';
import { CompanyMapper } from '../mappers/company.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class CompanyDocumentRepository implements CompanyRepository {
  constructor(
    @InjectModel(CompanySchemaClass.name)
    private readonly companyModel: Model<CompanySchemaClass>,
  ) {}

  async create(data: Company): Promise<Company> {
    const persistenceModel = CompanyMapper.toPersistence(data);
    const createdEntity = new this.companyModel(persistenceModel);
    const entityObject = await createdEntity.save();
    return CompanyMapper.toDomain(entityObject);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<Company[]> {
    const entityObjects = await this.companyModel
      .find()
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .limit(paginationOptions.limit);

    return entityObjects.map((entityObject) =>
      CompanyMapper.toDomain(entityObject),
    );
  }

  async findById(id: Company['id']): Promise<NullableType<Company>> {
    const entityObject = await this.companyModel.findById(id);
    return entityObject ? CompanyMapper.toDomain(entityObject) : null;
  }

  async findByIds(ids: Company['id'][]): Promise<Company[]> {
    const entityObjects = await this.companyModel.find({ _id: { $in: ids } });
    return entityObjects.map((entityObject) =>
      CompanyMapper.toDomain(entityObject),
    );
  }

  async findByBrandId(brandId: number): Promise<Company[]> {
    const entityObjects = await this.companyModel.find({ brandId });
    return entityObjects.map((entityObject) =>
      CompanyMapper.toDomain(entityObject),
    );
  }

  async update(
    id: Company['id'],
    payload: Partial<Company>,
  ): Promise<NullableType<Company>> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { _id: id.toString() };
    const entity = await this.companyModel.findOne(filter);

    if (!entity) {
      throw new Error('Record not found');
    }

    const entityObject = await this.companyModel.findOneAndUpdate(
      filter,
      CompanyMapper.toPersistence({
        ...CompanyMapper.toDomain(entity),
        ...clonedPayload,
      }),
      { new: true },
    );

    return entityObject ? CompanyMapper.toDomain(entityObject) : null;
  }

  async remove(id: Company['id']): Promise<void> {
    await this.companyModel.deleteOne({ _id: id });
  }
}
