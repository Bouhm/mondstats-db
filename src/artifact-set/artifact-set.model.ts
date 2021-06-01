import { Document, Schema as MongooseSchema } from 'mongoose';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export interface IAffix {
  activation_number: number;
  effect: string;
}

@Schema()
export class ArtifactSet {
  _id: MongooseSchema.Types.ObjectId;

  @Prop()
  id: number;

  @Prop()
  name: string;

  @Prop()
  affixes: IAffix[];
}

export type ArtifactSetDocument = ArtifactSet & Document;

export const ArtifactSetSchema = SchemaFactory.createForClass(ArtifactSet);
