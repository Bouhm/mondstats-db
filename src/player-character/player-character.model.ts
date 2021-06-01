import { Document, Schema as MongooseSchema } from 'mongoose';
import { Artifact } from 'src/artifact/artifact.model';
import { Character } from 'src/character/character.model';
import { Player } from 'src/player/player.model';
import { Weapon } from 'src/weapon/weapon.model';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class PlayerCharacter {
  _id: MongooseSchema.Types.ObjectId;

  @Prop()
  id: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: Character.name })
  character: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: Player.name })
  player: MongooseSchema.Types.ObjectId;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: Artifact.name }],
  })
  artifacts: MongooseSchema.Types.ObjectId[];

  @Prop()
  constellation: number;

  @Prop()
  element: string;

  @Prop()
  fetter: number;

  @Prop()
  level: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: Weapon.name })
  weapon: MongooseSchema.Types.ObjectId;
}

export type PlayerCharacterDocument = PlayerCharacter & Document;

export const PlayerCharacterSchema =
  SchemaFactory.createForClass(PlayerCharacter);
