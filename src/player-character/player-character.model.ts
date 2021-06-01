import { Document, Schema as MongooseSchema } from 'mongoose';
import { Player } from 'src/player/player.model';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Artifact } from '../artifact/artifact.model';
import { Character } from '../character/character.model';
import { Weapon } from '../weapon/weapon.model';

@Schema()
export class PlayerCharacter {
  _id: MongooseSchema.Types.ObjectId;

  @Prop()
  id: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Character' })
  character: Character;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Player' })
  player: Player;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Artifact' }],
  })
  artifacts: Artifact[];

  @Prop()
  constellation: number;

  @Prop()
  element: string;

  @Prop()
  fetter: number;

  @Prop()
  level: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Weapon' })
  weapon: Weapon;
}

export type PlayerCharacterDocument = PlayerCharacter & Document;

export const PlayerCharacterSchema =
  SchemaFactory.createForClass(PlayerCharacter);
