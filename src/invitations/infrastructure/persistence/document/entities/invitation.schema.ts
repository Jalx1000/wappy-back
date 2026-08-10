import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now, HydratedDocument } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';

export type InvitationSchemaDocument = HydratedDocument<InvitationSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class InvitationSchemaClass extends EntityDocumentHelper {
  @Prop({
    type: Number,
  })
  invitedByUserId?: number | null;

  @Prop({
    type: Number,
  })
  brandId?: number;

  @Prop({
    type: String,
  })
  status?: string;

  @Prop({
    type: String,
  })
  token?: string;

  @Prop({
    type: String,
  })
  role?: string | null;

  @Prop({
    type: String,
  })
  phone?: string | null;

  @Prop({
    type: String,
  })
  email?: string | null;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const InvitationSchema = SchemaFactory.createForClass(
  InvitationSchemaClass,
);
