import mongoose, { Document, Schema as MongooseSchema } from 'mongoose';

import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';

@ObjectType()
@Schema({ id: false })
export class ArtifactSet {
  @Field(() => String)
  _id: MongooseSchema.Types.ObjectId;

  @Field(() => Number)
  @Prop({ required: true, unique: true })
  id: number;

  @Field(() => [
    {
      activation_number: { type: Number },
      effect: { type: String },
    },
  ])
  @Prop(
    raw([
      {
        activation_number: { type: Number },
        effect: { type: String },
      },
    ]),
  )
  affixes: Record<string, any>[];

  @Field(() => String)
  @Prop({ required: true })
  name: string;
}

export type ArtifactSetDocument = ArtifactSet & Document;

export const ArtifactSetSchema = SchemaFactory.createForClass(ArtifactSet);

export default mongoose.model<ArtifactSetDocument>(ArtifactSet.name, ArtifactSetSchema);
