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

  @Prop()
  artifacts: Artifact[];

  @Prop()
  weapon: Weapon;

  @Prop()
  player: Player;
}

export type PlayerDocument = PlayerCharacter & Document;

export const PlayerSchema = SchemaFactory.createForClass(PlayerCharacter);
