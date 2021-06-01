import { Document, Schema as MongooseSchema } from 'mongoose';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Weapon {
  _id: MongooseSchema.Types.ObjectId;

  @Prop()
  id: number;

  @Prop()
  desc: string;

  @Prop()
  icon: string;

  @Prop()
  name: string;

  @Prop()
  rarity: number;

  @Prop()
  type: number;

  @Prop()
  type_name: string;
}

export type WeaponDocument = Weapon & Document;

export const WeaponSchema = SchemaFactory.createForClass(Weapon);
