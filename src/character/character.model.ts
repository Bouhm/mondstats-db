import mongoose, { Document, Schema as MongooseSchema } from 'mongoose';

import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';

export interface IConstellation {
  effect: string;
  id: number;
  name: string;
  pos: number;
  icon: string;
  is_actived?: boolean;
}

@ObjectType()
@Schema()
export class Character {
  @Field(() => String)
  _id: MongooseSchema.Types.ObjectId;

  @Field(() => Number)
  @Prop({ required: true, unique: true })
  id: number;

  @Field()
  @Prop(
    raw([
      {
        effect: { type: String },
        id: { type: Number, unique: true },
        name: { type: String },
        pos: { type: Number },
        icon: { type: String },
      },
    ]),
  )
  constellations: Record<string, any>[];

  @Field(() => String)
  @Prop({ required: true })
  element: string;

  @Field(() => String)
  @Prop({ required: true })
  name: string;

  @Field(() => Number)
  @Prop({ required: true })
  rarity: number;

  @Field(() => String)
  @Prop({ required: true })
  icon: string;

  @Field(() => String)
  @Prop({ required: true })
  image: string;
}

export type CharacterDocument = Character & Document;

export const CharacterSchema = SchemaFactory.createForClass(Character);

export default mongoose.model<CharacterDocument>(Character.name, CharacterSchema);
