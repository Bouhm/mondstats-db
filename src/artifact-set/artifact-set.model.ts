import { Document, Schema as MongooseSchema } from 'mongoose';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export interface IAffix {
  activation_number: number;
  effect: string;
}

@Schema()
export class ArtifactSet {
  _id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  id: number;

  @Prop({ required: true })
  affixes: IAffix[];

  @Prop({ required: true })
  name: string;
}

export type ArtifactSetDocument = ArtifactSet & Document;

export const ArtifactSetSchema = SchemaFactory.createForClass(ArtifactSet);
