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
export class Character {
  _id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  id: number;

  @Prop({ required: true })
  constellations: IConstellation[];

  @Prop({ required: true })
  element: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  rarity: number;

  @Prop({ required: true })
  icon: string;

  @Prop({ required: true })
  image: string;
}

export type CharacterDocument = Character & Document;

export const CharacterSchema = SchemaFactory.createForClass(Character);
