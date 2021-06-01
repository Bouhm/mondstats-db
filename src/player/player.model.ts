import { Document, Schema as MongooseSchema } from 'mongoose';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export interface IConstellation {
  effect: string;
  id: number;
  name: string;
  pos: number;
  icon: string;
  is_actived?: boolean;
}

@Schema()
export class Player {
  _id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, unique: true })
  uid: number;

  @Prop({ required: true })
  total_star: number;
}

export type PlayerDocument = Player & Document;

export const PlayerSchema = SchemaFactory.createForClass(Player);
