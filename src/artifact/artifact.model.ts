import { Document, Schema as MongooseSchema } from 'mongoose';

import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { ArtifactSet } from '../artifact-set/artifact-set.model';

@ObjectType()
@Schema()
export class Artifact {
  @Field(() => String)
  _id: MongooseSchema.Types.ObjectId;

  @Field(() => Number)
  @Prop({ required: true, unique: true })
  id: number;

  @Field(() => String)
  @Prop({ required: true })
  icon: string;

  @Field(() => String)
  @Prop({ required: true })
  name: string;

  @Field(() => Number)
  @Prop({ required: true })
  pos: number;

  @Field(() => String)
  @Prop({ required: true })
  pos_name: string;

  @Field(() => Number)
  @Prop({ required: true })
  rarity: number;

  @Field(() => String)
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: ArtifactSet.name,
    required: true,
  })
  set: MongooseSchema.Types.ObjectId;
}

export type ArtifactDocument = Artifact & Document;

export const ArtifactSchema = SchemaFactory.createForClass(Artifact);
