import { Document, Schema as MongooseSchema } from 'mongoose';

import { Prop, SchemaFactory } from '@nestjs/mongoose';

import { PlayerCharacter } from '../player-character/player-character.model';
import { Player } from '../player/player.model';

@Schema()
export class AbyssBattle {
  _id: MongooseSchema.Types.ObjectId;

  @Prop()
  floor: number;

  @Prop()
  level: number;

  @Prop()
  battle: number;

  @Prop()
  star: number;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'PlayerCharacter' }],
  })
  party: PlayerCharacter[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Player' })
  player: Player;
}

export type AbyssBattleDocument = AbyssBattle & Document;

export const AbyssBattleSchema = SchemaFactory.createForClass(AbyssBattle);
