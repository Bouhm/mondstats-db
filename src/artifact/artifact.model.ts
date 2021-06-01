import { Document, Schema as MongooseSchema } from 'mongoose';
import { ArtifactSet } from 'src/artifact-set/artifact-set.model';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Artifact {
  _id: MongooseSchema.Types.ObjectId;

  @Prop()
  id: number;

  @Prop()
  icon: string;

  @Prop()
  name: string;

  @Prop()
  pos: number;

  @Prop()
  pos_name: string;

  @Prop()
  rarity: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: ArtifactSet.name })
  set: MongooseSchema.Types.ObjectId;
}

export type ArtifactDocument = Artifact & Document;

export const ArtifactSchema = SchemaFactory.createForClass(Artifact);
