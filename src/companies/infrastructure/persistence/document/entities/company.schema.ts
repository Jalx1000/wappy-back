import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now, HydratedDocument } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';

export type CompanySchemaDocument = HydratedDocument<CompanySchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class CompanySchemaClass extends EntityDocumentHelper {
  @Prop({
    type: String,
  })
  notes?: string | null;

  @Prop({
    type: Number,
  })
  seats?: number | null;

  @Prop({
    type: String,
  })
  plan?: string | null;

  @Prop({
    type: String,
  })
  location?: string | null;

  @Prop({
    type: String,
  })
  industry?: string | null;

  @Prop({
    type: String,
  })
  domain?: string | null;

  @Prop({
    type: Number,
  })
  brandId?: number;

  @Prop({
    type: String,
  })
  name: string;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const CompanySchema = SchemaFactory.createForClass(CompanySchemaClass);
