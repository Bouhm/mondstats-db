import { Document, Schema as MongooseSchema } from 'mongoose';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export interface IConstellation {
  effect: string,
  id: number,
  name: string,
  pos: number,
  icon: string,
  is_actived?: boolean
}

@Schema()
export class Character {
  _id: MongooseSchema.Types.ObjectId;

  @Prop()
  constellations: IConstellation[];
  
  @Prop()
  element: string;
  
  @Prop()
  id: number;
  
  @Prop()
  name: string;
  
  @Prop()
  rarity: number;
}

export type CharacterDocument = Character & Document;

export const CharacterSchema = SchemaFactory.createForClass(Character);
