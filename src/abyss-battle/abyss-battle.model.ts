import { Document, Schema as MongooseSchema } from 'mongoose';

import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { PlayerCharacter } from '../player-character/player-character.model';
import { Player } from '../player/player.model';

@ObjectType('PartyStats')
export class PartyStats {
  @Field(() => [Number])
  party: number[];

  @Field(() => Number)
  count: number;
}

@ObjectType('AbyssStats')
export class AbyssStats {
  @Field(() => [[PartyStats]])
  party_stats: PartyStats[][];

  @Field(() => String)
  floor_level: string;
}

@ObjectType()
@Schema({ timestamps: true })
export class AbyssBattle {
  @Field(() => String)
  _id: MongooseSchema.Types.ObjectId;

  @Field(() => String)
  @Prop({ required: true })
  floor_level: string;

  @Field(() => Number)
  @Prop({ required: true })
  battle_index: number;

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
}

export type AbyssBattleDocument = AbyssBattle & Document;

export const AbyssBattleSchema = SchemaFactory.createForClass(AbyssBattle);
