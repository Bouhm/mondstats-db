import { Document, Schema as MongooseSchema } from 'mongoose';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Weapon {
  _id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, unique: true })
  id: number;

  @Prop({ required: true })
  desc: string;

  @Prop({ required: true })
  icon: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  rarity: number;

  @Prop({ required: true })
  type: number;

  @Prop({ required: true })
  type_name: string;
}

export type WeaponDocument = Weapon & Document;

export const WeaponSchema = SchemaFactory.createForClass(Weapon);
