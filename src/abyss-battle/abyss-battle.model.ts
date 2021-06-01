import { Document, Schema as MongooseSchema } from 'mongoose';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { PlayerCharacter } from '../player-character/player-character.model';
import { Player } from '../player/player.model';

@Schema()
export class AbyssBattle {
  _id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  battle: number;

  @Prop({ required: true })
  floor: number;

  @Prop({ required: true })
  level: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Player.name,
    required: true,
  })
  player: MongooseSchema.Types.ObjectId;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: PlayerCharacter.name }],
    required: true,
  })
  party: MongooseSchema.Types.ObjectId[];

  @Prop({ required: true })
  star: number;
}

export type AbyssBattleDocument = AbyssBattle & Document;

export const AbyssBattleSchema = SchemaFactory.createForClass(AbyssBattle);
