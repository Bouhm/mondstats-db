import { Document, Schema as MongooseSchema } from 'mongoose';
import { ArtifactSet } from 'src/artifact-set/artifact-set.model';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Artifact {
  _id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, unique: true })
  id: number;

  @Prop({ required: true })
  icon: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  pos: number;

  @Prop({ required: true })
  pos_name: string;

  @Prop({ required: true })
  rarity: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: ArtifactSet.name,
    required: true,
  })
  set: MongooseSchema.Types.ObjectId;
}

export type ArtifactDocument = Artifact & Document;

export const ArtifactSchema = SchemaFactory.createForClass(Artifact);
