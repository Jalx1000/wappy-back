import { Injectable } from '@nestjs/common';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConversationAssignmentSchemaClass } from '../entities/conversation-assignment.schema';
import {
  AssignmentInput,
  ConversationAssignmentRepository,
} from '../../conversation-assignment.repository';
import { ConversationAssignment } from '../../../../domain/conversation-assignment';
import { ConversationAssignmentMapper } from '../mappers/conversation-assignment.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class ConversationAssignmentDocumentRepository implements ConversationAssignmentRepository {
  constructor(
    @InjectModel(ConversationAssignmentSchemaClass.name)
    private readonly conversationAssignmentModel: Model<ConversationAssignmentSchemaClass>,
  ) {}

  async create(data: ConversationAssignment): Promise<ConversationAssignment> {
    const persistenceModel = ConversationAssignmentMapper.toPersistence(data);
    const createdEntity = new this.conversationAssignmentModel(
      persistenceModel,
    );
    const entityObject = await createdEntity.save();
    return ConversationAssignmentMapper.toDomain(entityObject);
  }

  async findByConversationId(
    conversationId: string,
  ): Promise<NullableType<ConversationAssignment>> {
    const doc = await this.conversationAssignmentModel.findOne({
      conversationId,
    });
    return doc ? ConversationAssignmentMapper.toDomain(doc) : null;
  }

  async findByConversationIds(
    conversationIds: string[],
  ): Promise<ConversationAssignment[]> {
    const docs = await this.conversationAssignmentModel.find({
      conversationId: { $in: conversationIds },
    });
    return docs.map((d) => ConversationAssignmentMapper.toDomain(d));
  }

  async upsert(input: AssignmentInput): Promise<ConversationAssignment> {
    const doc = await this.conversationAssignmentModel.findOneAndUpdate(
      { conversationId: input.conversationId },
      {
        conversationId: input.conversationId,
        channel: input.channel,
        brandId: input.brandId,
        assignedUserId: input.assignedUserId,
        assignedTeamId: input.assignedTeamId,
      },
      { new: true, upsert: true },
    );
    return ConversationAssignmentMapper.toDomain(doc);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<ConversationAssignment[]> {
    const entityObjects = await this.conversationAssignmentModel
      .find()
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .limit(paginationOptions.limit);

    return entityObjects.map((entityObject) =>
      ConversationAssignmentMapper.toDomain(entityObject),
    );
  }

  async findById(
    id: ConversationAssignment['id'],
  ): Promise<NullableType<ConversationAssignment>> {
    const entityObject = await this.conversationAssignmentModel.findById(id);
    return entityObject
      ? ConversationAssignmentMapper.toDomain(entityObject)
      : null;
  }

  async findByIds(
    ids: ConversationAssignment['id'][],
  ): Promise<ConversationAssignment[]> {
    const entityObjects = await this.conversationAssignmentModel.find({
      _id: { $in: ids },
    });
    return entityObjects.map((entityObject) =>
      ConversationAssignmentMapper.toDomain(entityObject),
    );
  }

  async update(
    id: ConversationAssignment['id'],
    payload: Partial<ConversationAssignment>,
  ): Promise<NullableType<ConversationAssignment>> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { _id: id.toString() };
    const entity = await this.conversationAssignmentModel.findOne(filter);

    if (!entity) {
      throw new Error('Record not found');
    }

    const entityObject =
      await this.conversationAssignmentModel.findOneAndUpdate(
        filter,
        ConversationAssignmentMapper.toPersistence({
          ...ConversationAssignmentMapper.toDomain(entity),
          ...clonedPayload,
        }),
        { new: true },
      );

    return entityObject
      ? ConversationAssignmentMapper.toDomain(entityObject)
      : null;
  }

  async remove(id: ConversationAssignment['id']): Promise<void> {
    await this.conversationAssignmentModel.deleteOne({ _id: id });
  }
}
