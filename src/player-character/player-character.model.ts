import { Document, Schema as MongooseSchema } from 'mongoose';
import { Player } from 'src/player/player.model';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Artifact } from '../artifact/artifact.model';
import { Weapon } from '../weapon/weapon.model';

@Schema()
export class PlayerCharacter {
  _id: MongooseSchema.Types.ObjectId;

  @Prop()
  id: number;

  @Prop()
  level: number;

  @Prop()
  fetter: number;

  @Prop()
  element: string;

  @Prop()
  constellation: number;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Artifact' }],
  })
  artifacts: Artifact[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Weapon' })
  weapon: Weapon;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Player' })
  player: Player;
}

export type PlayerDocument = PlayerCharacter & Document;

export const PlayerSchema = SchemaFactory.createForClass(PlayerCharacter);
