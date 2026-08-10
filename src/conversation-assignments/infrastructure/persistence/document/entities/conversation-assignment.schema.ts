import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now, HydratedDocument } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';

export type ConversationAssignmentSchemaDocument =
  HydratedDocument<ConversationAssignmentSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class ConversationAssignmentSchemaClass extends EntityDocumentHelper {
  @Prop({
    type: String,
  })
  assignedTeamId?: string | null;

  @Prop({
    type: Number,
  })
  assignedUserId?: number | null;

  @Prop({
    type: Number,
  })
  brandId?: number;

  @Prop({
    type: String,
  })
  channel?: string;

  @Prop({
    type: String,
  })
  conversationId?: string;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const ConversationAssignmentSchema = SchemaFactory.createForClass(
  ConversationAssignmentSchemaClass,
);
