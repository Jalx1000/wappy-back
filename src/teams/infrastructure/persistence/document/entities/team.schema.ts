import { UserSchemaClass } from '../../../../../users/infrastructure/persistence/document/entities/user.schema';

import mongoose from 'mongoose';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now, HydratedDocument } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';

export type TeamSchemaDocument = HydratedDocument<TeamSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class TeamSchemaClass extends EntityDocumentHelper {
  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserSchemaClass',
        autopopulate: true,
      },
    ],
  })
  members?: UserSchemaClass[];

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

export const TeamSchema = SchemaFactory.createForClass(TeamSchemaClass);
