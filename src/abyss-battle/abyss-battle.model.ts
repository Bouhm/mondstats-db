import { Document, Schema as MongooseSchema } from 'mongoose';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { PlayerCharacter } from '../player-character/player-character.model';
import { Player } from '../player/player.model';

@Schema()
export class AbyssBattle {
  _id: MongooseSchema.Types.ObjectId;

  @Prop()
  battle: number;

  @Prop()
  floor: number;

  @Prop()
  level: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Player' })
  player: Player;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'PlayerCharacter' }],
  })
  party: PlayerCharacter[];

  @Prop()
  star: number;
}

export type AbyssBattleDocument = AbyssBattle & Document;

export const AbyssBattleSchema = SchemaFactory.createForClass(AbyssBattle);
