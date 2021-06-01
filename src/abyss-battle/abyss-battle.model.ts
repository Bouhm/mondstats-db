import mongoose, { Document, Schema as MongooseSchema } from 'mongoose';

import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { PlayerCharacter } from '../player-character/player-character.model';
import { Player } from '../player/player.model';

@ObjectType()
@Schema()
export class AbyssBattle {
  @Field(() => String)
  _id: MongooseSchema.Types.ObjectId;

  @Field(() => Number)
  @Prop({ required: true })
  battle: number;

  @Field(() => String)
  @Prop({ required: true })
  floorLevel: string;

  @Field(() => String)
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Player.name,
    required: true,
  })
  player: MongooseSchema.Types.ObjectId;

  @Field(() => [String])
  @Prop({
    type: [MongooseSchema.Types.ObjectId],
    ref: PlayerCharacter.name,
    required: true,
  })
  party: MongooseSchema.Types.ObjectId[];

  @Field(() => Number)
  @Prop({ required: true })
  star: number;
}

export type AbyssBattleDocument = AbyssBattle & Document;

export const AbyssBattleSchema = SchemaFactory.createForClass(AbyssBattle);

export default mongoose.model<AbyssBattleDocument>(AbyssBattle.name, AbyssBattleSchema);
