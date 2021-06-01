import { Document, Schema as MongooseSchema } from 'mongoose';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Weapon {
  _id: MongooseSchema.Types.ObjectId;

  @Prop()
  desc: string;

  @Prop()
  id: number;

  @Prop()
  name: string;

  @Prop()
  rarity: number;

  @Prop()
  type: number;

  @Prop()
  type_name: string;

  @Prop()
  icon: string;
}

export type WeaponDocument = Weapon & Document;

export const WeaponSchema = SchemaFactory.createForClass(Weapon);
